#!/usr/bin/env python3
"""
Importador de minutas (.docx) -> plantillas del generador.

Convierte las minutas de `.assets to learn/` en módulos JS que el generador
de documentos entiende (assets/js/data/minutas/<area>/<codigo>.js) y un
índice por área (assets/js/data/minutas/<area>/index.js).

Convenciones de las minutas que se reconocen:
  XXX                         espacio por llenar  -> campo del formulario
  (a / b / c)                 opciones            -> selector
  **XXX** (pista / pista)     pista del espacio   -> ejemplo del campo
  (Si aplica) / (Si ...)      párrafo opcional    -> interruptor «Incluir»
  (Escoja ...) a) b) c)       elegir un supuesto  -> selector (o varios)
  (o: alternativa)            redacción alterna   -> selector entre dos redacciones
  [VERIFICAR ...]             nota interna        -> aviso en el editor (no va al PDF)
  Bloques estándar: lugar y fecha, «Yo, XXX, mayor de edad...», notificaciones y firma
  se conectan a los datos de la persona (nombre, documento, género, contacto).

Metadatos curados (títulos, resumen, plan, canales, etiquetas de campos):
  tools/minutas_meta.json

Uso:  python tools/import_minutas.py
"""
import json
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '.assets to learn')
OUT = os.path.join(ROOT, 'src', 'js', 'data', 'minutas')
META = os.path.join(ROOT, 'tools', 'minutas_meta.json')
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
AREAS = {'minutassalud': 'salud', 'minutasserviciospublicos': 'servicios', 'minutastransito': 'transito'}
FIELD = '\u2063'  # marcador interno de "XXX" mientras se procesa
GMARK = '\u2090'  # \u00ab(a)\u00bb protegido: no toma el g\u00e9nero de quien firma

# --------------------------------------------------------------------------
# Lectura del .docx
# --------------------------------------------------------------------------

def run_text(r):
    out = []
    for n in r.iter():
        if n.tag == W + 't':
            out.append(n.text or '')
        elif n.tag == W + 'tab':
            out.append('\t')
        elif n.tag in (W + 'br', W + 'cr'):
            out.append('\n')
    return ''.join(out)


def para_text(p):
    parts = []
    for r in p.iter(W + 'r'):
        t = run_text(r)
        if not t:
            continue
        rpr = r.find(W + 'rPr')
        b = rpr.find(W + 'b') if rpr is not None else None
        bold = b is not None and b.get(W + 'val') not in ('0', 'false')
        parts.append(f'**{t}**' if bold and t.strip() else t)
    text = ''.join(parts)
    text = re.sub(r'\*\*(\s*)\*\*', r'\1', text)  # une negritas contiguas
    align = ''
    ppr = p.find(W + 'pPr')
    if ppr is not None and ppr.find(W + 'jc') is not None:
        align = ppr.find(W + 'jc').get(W + 'val')
    return text, align


def read_docx(path):
    with zipfile.ZipFile(path) as z:
        body = ET.fromstring(z.read('word/document.xml')).find(W + 'body')
    items = []
    for el in body:
        if el.tag == W + 'p':
            text, align = para_text(el)
            if text.strip():
                items.append({'kind': 'p', 'text': text.strip(), 'align': align})
        elif el.tag == W + 'tbl':
            rows = []
            for tr in el.iter(W + 'tr'):
                row = []
                for tc in tr.iter(W + 'tc'):
                    row.append(' '.join(para_text(p)[0].strip() for p in tc.iter(W + 'p') if para_text(p)[0].strip()))
                rows.append(row)
            items.append({'kind': 'table', 'rows': rows})
    return items

# --------------------------------------------------------------------------
# Utilidades de texto
# --------------------------------------------------------------------------

def strip_md(s):
    return s.replace('**', '')


def balance_bold(s):
    return s if s.count('**') % 2 == 0 else s.replace('**', '')


def find_paren(s, start):
    """Índice del paréntesis que cierra el que abre en `start` (con anidación)."""
    depth = 0
    for i in range(start, len(s)):
        if s[i] == '(':
            depth += 1
        elif s[i] == ')':
            depth -= 1
            if depth == 0:
                return i
    return -1


def split_top(s, sep=' / '):
    """Divide por `sep` solo en el nivel superior de paréntesis."""
    parts, depth, cur, i = [], 0, '', 0
    while i < len(s):
        if s[i] == '(':
            depth += 1
        elif s[i] == ')':
            depth -= 1
        if depth == 0 and s.startswith(sep, i):
            parts.append(cur)
            cur = ''
            i += len(sep)
            continue
        cur += s[i]
        i += 1
    parts.append(cur)
    return [p.strip() for p in parts]


STOP = {'el', 'la', 'los', 'las', 'de', 'del', 'y', 'e', 'a', 'al', 'en', 'o', 'que', 'con', 'por', 'un', 'una', 'yo', 'se', 'su', 'mi', 'no', 'lo'}
IMPERATIVE = re.compile(r'^(describa|indique|especifique|relacione|señale|anote|escriba|adjunte|mencione|detalle|explique|cuente|nombre de|número de|fecha de|ej\.|por ejemplo|incluya|precise|identifique|liste|resuma)', re.I)
CITATION = re.compile(r'^(art[íi]culo|arts?\.|ley|decreto|sentencia|numeral|literal|inciso|par[áa]grafo|resoluci[óo]n|circular|c\.p\.|cpaca|cgp|en adelante|\d)', re.I)
GENDER_WORD = re.compile(r'\b([A-Za-zÁÉÍÓÚáéíóúñÑüÜ]+?o?)\(a\)')
FIRST_PERSON = re.compile(r'\b(soy|estoy|fui|me encuentro|encontrarme|estar|quedé|resulté|he sido|como)\s+$', re.I)

# Reglas canónicas: (contexto izquierdo, contexto derecho) -> campo con id fijo.
# El mismo id se reutiliza dentro de una minuta (p. ej. el nombre de la EPS que aparece varias veces).
# id que empieza por '@' = dato de la persona que firma (no crea campo).
SIGNER = r'(Accionante|Demandante|Convocante|Actor popular|Peticionari[oa]|Solicitante|Recurrente|Quejos[oa]|Reclamante|Usuari[oa]|Afiliad[oa]|Incidentante|Impugnante)'
CANON = [
    (r'^$', r'^\s*EPS\b', 'eps', 'Nombre de la EPS', 'text', 'Ej.: Nueva EPS, Sanitas, Coosalud'),
    (r'(de|a|ante|contra|la)$', r'^\s*EPS\b', 'eps', 'Nombre de la EPS', 'text', 'Ej.: Nueva EPS, Sanitas, Coosalud'),
    (r'', r'^\s*S·A· E·S·P', 'empresa', 'Nombre de la empresa de servicios públicos', 'text', 'Como aparece en la factura'),
    (r'(Contrato|cuenta)[^.]{0,30}No·?:?$', r'', 'contrato', 'Número de contrato, cuenta o NIC', 'text', 'Aparece en la factura'),
    (r'[Ii]nmueble ubicado en$', r'', 'inmueble', 'Dirección del inmueble', 'text', None),
    (r'[Ee]strato$', r'', 'estrato', 'Estrato del inmueble', 'text', 'Ej.: 2'),
    (r'(Paciente:|[Ee]l paciente|[Ll]a paciente|del paciente)$', r'', 'pac_nombre', 'Nombre del paciente', 'text', None),
    (r'(Paciente|Víctima): …\s*–\s*Documento No·?$', r'', 'pac_doc', 'Documento del paciente', 'text', None),
    (r'(Diagnóstico:|padece)$', r'', 'diagnostico', 'Diagnóstico o enfermedad', 'text', 'Como aparece en la historia clínica'),
    (r'(Víctima:)$', r'', 'pac_nombre', 'Nombre de la víctima', 'text', None),
    (r'(médico tratante|médica tratante)$', r'^\s*de la IPS', 'medico', 'Nombre del médico tratante', 'text', None),
    (r'(de la IPS|la IPS|IPS:)$', r'', 'ips', 'IPS (clínica, hospital o centro de salud)', 'text', None),
    (r'[Pp]laca:?$', r'', 'placa', 'Placa del vehículo', 'text', 'Ej.: ABC123'),
    (r'[Cc]omparendos? No·?:?$', r'', 'comparendo', 'Número de la orden de comparendo', 'text', None),
    (r'(MOVILIDAD|TRÁNSITO|TRANSPORTE|Movilidad|Tránsito|Transporte) DE$|(Movilidad|Tránsito|Transporte) de$', r'', 'transito_ciudad', 'Municipio del organismo de tránsito', 'text', 'Ej.: Cúcuta'),
    (r'agente oficioso de$', r'', 'rep_nombre', 'Nombre de la persona a quien representas', 'text', None),
    (r'agente oficioso de …, identificadoª con$', r'', 'rep_tipodoc', 'Tipo de documento de esa persona', 'text', 'Ej.: registro civil, tarjeta de identidad'),
    (r'agente oficioso de …, identificadoª con … No·$', r'', 'rep_doc', 'Número de documento de esa persona', 'text', None),
    (r'propia defensa por$', r'', 'rep_motivo', 'Por qué esa persona no puede actuar por sí misma', 'text', 'Ej.: es menor de edad, está hospitalizada'),
    (SIGNER + r':$', r'^\s*(,|$|–|\.)', '@nombre', None, None, None),
    (SIGNER + r': …, C·C· No·$', r'', '@numDoc', None, None, None),
    (r'(Radicado:|[Rr]adicado No·|con radicado|radicado)$', r'', None, 'Número de radicado', 'text', None),
    (r'Resolución No·$', r'', None, 'Número de la resolución', 'text', None),
    (r'Resolución No· … del$', r'', None, 'Fecha de la resolución', 'date', None),
    (r'cobro coactivo No·:?$', r'', 'coactivo', 'Número del proceso de cobro coactivo', 'text', None),
    (r'[Pp]orque$|[Pp]ues$|debido a que$', r'', None, '¿Por qué? Explícalo con tus palabras', 'textarea', None),
    (r'JUEZ[^.]{0,40}(DE|CIRCUITO DE)$', r'', 'juzgado_ciudad', 'Ciudad o circuito del juzgado', 'text', 'Ej.: Cúcuta'),
    (r'Con copia a:$', r'', None, 'Con copia a (entidad o persona)', 'text', None),
    (r'(Accionad[oa]|Demandad[oa]s?|Entidad accionada|Querellad[oa]|Convocad[oa]|Incidentad[oa]):$', r'', 'contraparte', 'Nombre de la entidad o persona contra quien va', 'text', None),
    (r'[Mm]unicipio de$', r'', 'municipio', 'Municipio', 'text', None),
]


def protect(s):
    s = s.replace('(a)', 'ª')
    for x, y in (('S.A. E.S.P.', 'S·A· E·S·P·'), ('E.S.P.', 'E·S·P·'), ('C.C.', 'C·C·'), ('S.A.S.', 'S·A·S·'), ('E.S.E.', 'E·S·E·')):
        s = s.replace(x, y)
    return re.sub(r'\b(No|Nro|art|Arts?|Res|núm)\.', r'\1·', s)


def unprotect(s):
    return s.replace('ª', '(a)').replace('·', '.')

# --------------------------------------------------------------------------
# Conversión de una minuta
# --------------------------------------------------------------------------

class Minuta:
    def __init__(self, code, meta):
        self.code = code
        self.meta = meta
        self.fields = []        # [{id, type, label, ...}]
        self.notes = []
        self.blocks = []
        self.n = 0
        self.step = None        # paso actual (id)
        self.steps = []         # [{id, title, fields:[ids]}]
        self.labels_override = meta.get('labels', {})
        self.cond_stack = None  # condición del párrafo actual (para campos anidados)
        self.pending_escoja = False  # «(escoja y ajuste):» abre una elección en los renglones a), b)…

    # ----- pasos
    def open_step(self, title):
        sid = f's{len(self.steps) + 1}'
        self.steps.append({'id': sid, 'title': title, 'fields': []})
        self.step = sid

    def add_field(self, f, when=None):
        if when:
            f['when'] = when
        self.fields.append(f)
        if not self.steps:
            self.open_step('Destinatario y asunto')
        self.steps[-1]['fields'].append(f['id'])
        return f['id']

    def new_id(self, prefix='f'):
        self.n += 1
        return f'{prefix}{self.n}'

    # ----- etiquetas automáticas
    def find(self, fid):
        return next((f for f in self.fields if f['id'] == fid), None)

    def auto_field(self, before, after, when=None, hint=None):
        b = strip_md(before).replace(FIELD, '…').replace(GMARK, '(a)')
        a = strip_md(after).replace(FIELD, '…').replace(GMARK, '(a)')
        b = re.sub(r'\{\{[^}]*\}\}|\[\[[^\]]*\]\]', '…', b)
        a = re.sub(r'\{\{[^}]*\}\}|\[\[[^\]]*\]\]', '…', a)
        B, A = protect(b), protect(a)

        # Documento de la persona mencionada justo antes («Paciente: … – Documento No. …»)
        if re.search(r'(Paciente|Víctima|Afectad[oa]|Menor):\s*…\s*–\s*Documento No·?:?$', B.strip()):
            if self.find('pac_doc'):
                return 'pac_doc', '{{pac_doc}}'
            f = {'id': 'pac_doc', 'type': 'text', 'label': 'Número de documento del paciente', 'required': True}
            self._finish(f, b, a, when)
            return 'pac_doc', '{{pac_doc}}'
        L = re.split(r'[.;\n()–—]|\t', B)[-1].strip()
        R = A[:60]
        token_filter = ''

        # Reglas canónicas
        for lre, rre, cid, clabel, ctype, chint in CANON:
            if (lre == '' or re.search(lre, L)) and (rre == '' or re.search(rre, R)) and (lre or rre):
                if cid and cid.startswith('@'):
                    return None, '{{' + cid[1:] + '}}'
                if cid and self.find(cid):
                    f = self.find(cid)
                    return cid, '{{' + cid + ('|cop' if f['type'] == 'money' else '') + '}}'
                fid = cid or self.new_id()
                f = {'id': fid, 'type': ctype or 'text', 'label': clabel, 'required': True}
                if hint or chint:
                    f['placeholder'] = hint or chint
                if f['type'] == 'date':
                    f['placeholder'] = 'Ej.: 3 de octubre de 2026'
                self._finish(f, b, a, when)
                return fid, '{{' + fid + '}}'

        left = L if L.endswith(':') else re.split(r'[:,]\s', L)[-1].strip()
        left = ' '.join(left.split()[-7:])
        right = ' '.join(re.split(r'[.:;()\n–—]|, ', A)[0].split()[:7])
        meaningful = [w for w in left.lower().replace(':', '').split() if w.strip('.,·') not in STOP and w != '…']
        ftype = 'text'
        inputmode = None
        DATE_END = r'(^|\s)(entre el|desde el|hasta el|y el|el|El|del día|el día|[Ff]echa:?)$'

        if b.rstrip().endswith('$'):
            ftype = 'money'
            stem = left.rstrip('$ ').strip()
            if '…' in stem:
                stem = stem.rsplit('…', 1)[1].strip(' ,')
            label =(stem[0].upper() + stem[1:] + ' (valor en pesos)') if [w for w in stem.lower().split() if w not in STOP] else 'Valor en pesos'
            token_filter = '|cop'
        elif (re.search(DATE_END, left) and not re.search(r'\b(en|por|a|con|de) (el|la)$', left)) or re.search(r'(No·|número) … del$', L):
            ftype = 'date'
            stem = re.sub(r'\s*(entre el|desde el|hasta el|y el|el|El|del día|el día|[Ff]echa:?|del)$', '', left).strip()
            if left.endswith('entre el'):
                label = 'Fecha inicial' + (f' ({stem})' if stem else '')
            elif left.endswith('y el') and 'entre el' in b[-60:]:
                label = 'Fecha final'
            elif [w for w in stem.lower().split() if w not in STOP and w != '…']:
                label = f'{stem[0].upper() + stem[1:]} (fecha)'
            elif right:
                label = f'Fecha en que {right}'
            else:
                label = 'Fecha'
        elif L.endswith(':') and L.strip(': …'):
            label = ' '.join(L.rstrip(':').split()[-5:])
            label = label[0].upper() + label[1:]
        elif meaningful:
            if '…' in left:
                tail = left.rsplit('…', 1)[1].strip(' ,')
                if [w for w in tail.lower().split() if w not in STOP]:
                    left = tail
            label = left[0].upper() + left[1:]
        elif not right or re.fullmatch(r'[\s.…]*', right):
            st = self.steps[-1]['title'].lower() if self.steps else ''
            if 'hecho' in st:
                label = 'Escribe este hecho'
            elif 'prueba' in st or 'anexo' in st:
                label = 'Prueba o documento que adjuntas'
            elif 'petici' in st or 'pretensi' in st or 'solicit' in st:
                label = 'Escribe lo que pides'
            elif not self.steps or 'destinatario' in st:
                label = 'Destinatario (entidad o persona)'
            else:
                label = 'Completa este punto'
            ftype = 'textarea'
        else:
            label = f'Dato antes de «{right}»'

        if ftype == 'text':
            if re.match(r'^\s*\(?\s*(días|meses|años|personas|horas|%|semanas|veces|salarios)\b', a):
                inputmode = 'numeric'
            if re.search(r'(:|porque|pues|que|motivo|razón|argumento de|consistente en|así:)\s*$', b.strip()) and re.match(r'^\s*\.?\s*$', a[:2]):
                ftype = 'textarea'
        label = unprotect(label)
        if sum(1 for c in label if c.isupper()) > len(label) * 0.6:
            label = label.capitalize()
        st = self.steps[-1]['title'].lower() if self.steps else ''
        if 'notific' in st and re.fullmatch(r'(Dirección|Correo electrónico|Correo|Celular|Teléfono)', label):
            label = f'{label} de la contraparte'
        label = re.sub(r'\s+', ' ', label).strip(' ,')
        if len(label) > 72:
            label = label[:69].rsplit(' ', 1)[0] + '…'
        fid = self.new_id()
        f = {'id': fid, 'type': ftype, 'label': label, 'required': True}
        if inputmode:
            f['inputmode'] = inputmode
        if hint:
            f['placeholder'] = hint
        if ftype == 'date' and not hint:
            f['placeholder'] = 'Ej.: 3 de octubre de 2026'
        self._finish(f, b, a, when)
        return fid, '{{' + fid + token_filter + '}}'

    def _finish(self, f, b, a, when):
        ctx = re.sub(r'\s+', ' ', (b[-70:] + ' ____ ' + a[:70]).strip())
        f['help'] = f'En el documento: «…{ctx}…»'
        self.add_field(f, when)

    # ----- conversión de texto en línea
    def convert_inline(self, text, when=None, gender_all=False):
        """Convierte XXX, opciones, pistas y alternativas de un texto."""
        s = text
        notes = re.findall(r'\[VERIFICAR[^\]]*\]', strip_md(s))
        for nt in notes:
            self.notes.append(nt.strip('[]').replace('VERIFICAR', 'Verificar').strip())
        s = re.sub(r'\s*\**\[VERIFICAR[^\]]*\]\**', '', s)
        s = s.replace('**XXX**', FIELD).replace('XXX', FIELD)
        if gender_all:
            s = GENDER_WORD.sub(lambda m: '{{g:' + m.group(1) + '(a)}}', s)
        else:
            def g1(m):
                return ('{{g:' + m.group(1) + '(a)}}') if FIRST_PERSON.search(s[:m.start()][-30:]) else m.group(0)
            s = GENDER_WORD.sub(g1, s)
        out = ''
        i = 0
        while i < len(s):
            ch = s[i]
            if ch == FIELD:
                before = out
                after = re.sub(r'^\s*\**', '', s[i + 1:])
                hint = None
                # pista entre paréntesis justo después del espacio
                m = re.match(r'^(\**\s*\**)\(', s[i + 1:])
                consumed = 0
                if m:
                    start = i + 1 + len(m.group(1))
                    end = find_paren(s, start)
                    inner = s[start + 1:end] if end > 0 else ''
                    low_inner = strip_md(inner).strip().lower()
                    if end > 0 and low_inner.startswith('escoja'):
                        # «XXX (escoja: A / B)»: el espacio es la elección entre A y B
                        # «XXX (escoja y ajuste):» seguido de opciones a), b)…: elección en los renglones siguientes
                        opts_txt = inner.split(':', 1)[1].strip() if ':' in inner else ''
                        if ' / ' in opts_txt:
                            s = s[:start] + '(' + opts_txt + ')' + s[end + 1:]
                            i += 1 + len(m.group(1))
                        else:
                            self.pending_escoja = True
                            i = end + 1
                        continue
                    if end > 0 and FIELD not in inner and not CITATION.match(inner) and not inner.lower().startswith(('o:', 'si ', 'escoja')):
                        opts = split_top(inner)
                        hint = ('Ej.: ' + ', '.join(o for o in opts if o)) if len(opts) > 1 else (inner[0].upper() + inner[1:])
                        consumed = end - i
                        after = s[end + 1:]
                    elif end > 0 and FIELD in inner and ' / ' in inner and not inner.lower().startswith(('o:', 'si ', 'escoja')):
                        # «XXX (opción / opción con XXX)»: el espacio ES la elección; no crea campo aparte
                        i += 1 + len(m.group(1))
                        continue
                fid, token = self.auto_field(before, after, when, hint)
                out += token
                i += 1 + consumed
                continue
            if ch == '(':
                end = find_paren(s, i)
                if end < 0:
                    out += ch
                    i += 1
                    continue
                inner = s[i + 1:end]
                bare = strip_md(inner).strip()
                low = bare.lower()
                if low.startswith('o:'):
                    alt = inner.split(':', 1)[1].strip()
                    out = self.make_alternative(out, alt, when)
                    i = end + 1
                    continue
                if IMPERATIVE.match(bare) and FIELD not in inner:
                    # instrucción para quien llena: va como ayuda del último campo
                    if self.fields:
                        self.fields[-1]['placeholder'] = bare[0].upper() + bare[1:]
                    out = out.rstrip()
                    i = end + 1
                    continue
                if ' / ' in inner and not CITATION.match(bare):
                    opts = split_top(inner)
                    out += self.make_choice(opts, out, s[end + 1:], when)
                    i = end + 1
                    continue
                out += '(' + self.convert_inline_fragment(inner, when) + ')'
                i = end + 1
                continue
            out += ch
            i += 1
        out = re.sub(r'\s+([,.;:])', r'\1', out)
        out = re.sub(r'[ \t]{2,}', ' ', out)
        return balance_bold(out.strip())

    def convert_inline_fragment(self, inner, when):
        # Paréntesis normal: puede contener campos
        res = ''
        j = 0
        while j < len(inner):
            if inner[j] == FIELD:
                fid, token = self.auto_field(res, inner[j + 1:], when)
                res += token
            else:
                res += inner[j]
            j += 1
        return res

    def make_choice(self, opts, before, after, when):
        cid = self.new_id('c')
        clean = [strip_md(o).replace(GMARK, '(a)').strip() for o in opts]
        b = re.sub(r'\{\{[^}]*\}\}|\[\[[^\]]*\]\]', '…', strip_md(before))
        left = re.split(r'[.:;\n]|, ', protect(b))[-1].strip()
        left = unprotect(' '.join(left.split()[-6:]))
        joined = ' '.join(clean).lower()
        if 'agente oficioso' in joined or 'nombre propio' in joined:
            label = '¿Para quién presentas este documento?'
        elif re.search(r'régimen$', left):
            label = 'Régimen de afiliación a salud'
        elif re.search(r'en calidad de$', left):
            label = '¿En qué calidad actúas?'
        elif left and re.sub(r'[\s…,]|\b(y|e|o|u|que|el|la|de)\b', '', left, flags=re.I):
            label = left[0].upper() + left[1:] + ' …'
        else:
            label = 'Elige la opción que corresponde'
        options = []
        for k, o in enumerate(clean):
            options.append({'value': str(k), 'label': re.sub(r'\{\{g:([^}]*)\}\}', r'\1', o.replace(FIELD, '…'))})
        f = {'id': cid, 'type': 'radio' if len(options) <= 4 else 'select', 'label': label, 'options': options, 'default': '0', 'required': True,
             'help': 'Elige la que corresponde a tu caso.'}
        self.add_field(f, when)
        segs = []
        for k, o in enumerate(opts):
            cond = f'{cid}={k}'
            inner_when = cond if not when else f'{when}&{cond}'
            text = self.convert_inline_fragment(o.replace('XXX', FIELD), inner_when)
            segs.append(f'[[{cond}|{text}]]')
        return ''.join(segs)

    def make_alternative(self, out, alt, when):
        """`frase (o: alternativa)`: elegir entre la frase anterior y la alternativa."""
        # frase anterior: desde la última coma / punto / dos puntos, máximo 10 palabras
        tail = re.split(r'(?<=[,;:.])\s', out)[-1]
        words = tail.split(' ')
        alt_words = strip_md(alt).split()
        if len(alt_words) <= 2 and not re.search(r'\{\{|\[\[', words[-1] if words else ''):
            prev = words[-1]
        else:
            prev = ' '.join(words[-10:]) if len(words) > 10 else tail
        if not prev.strip() or re.fullmatch(r'\{\{[^}]+\}\}', prev.strip()):
            prev = tail
        head = out[: len(out) - len(prev)]
        cid = self.new_id('c')
        opt_a = strip_md(prev).strip()
        opt_b = strip_md(alt).strip()
        f = {'id': cid, 'type': 'radio', 'label': 'Elige la redacción que corresponde', 'default': '0', 'required': True,
             'options': [{'value': '0', 'label': re.sub(r'\{\{[^}]*\}\}', '…', re.sub(r'\[\[[^|]*\|', '', opt_a).replace(']]', ''))},
                         {'value': '1', 'label': opt_b.replace('XXX', '…').replace(FIELD, '…')}]}
        f['options'][0]['label'] = f['options'][0]['label'].replace(FIELD, '…')
        self.add_field(f, when)
        b_text = self.convert_inline_fragment(alt.replace('XXX', FIELD), f'{when}&{cid}=1' if when else f'{cid}=1')
        return f'{head}[[{cid}=0|{prev}]][[{cid}=1|{b_text}]]'

# --------------------------------------------------------------------------
# Proceso del documento completo
# --------------------------------------------------------------------------

HEADING = re.compile(r'^\**\s*([IVX]+)\.\s+(.+?)\**$')
LIST_NUM = re.compile(r'^(\d+)\.\s*\t?\s*(.*)$', re.S)
LIST_ALPHA = re.compile(r'^([a-z])\)\s*\t?\s*(.*)$', re.S)
COND = re.compile(r'^\**\(\s*(Si [^)]*|si aplica)\)\**\s*', re.I)
ESCOJA = re.compile(r'^\**\(\s*(Escoja[^)]*)\)\**\s*', re.I)
YO_STD = re.compile(r'Yo,\s*XXX,\s*mayor de edad,\s*identificado\(a\) con cédula de ciudadanía No\.\s*XXX\s*expedida en\s*XXX,\s*domiciliado\(a\) en\s*XXX', re.I)
DATE_LINE = re.compile(r'^XXX,\s*XXX de XXX de XXX\.?$')


def title_case(h):
    h = h.strip().rstrip(':').lower()
    return h[0].upper() + h[1:]


def convert(code, items, meta):
    m = Minuta(code, meta)
    blocks = m.blocks
    phase = 'start'        # start -> dest -> body
    pending_list = None
    escoja = None          # {'id', 'multi', 'when'}
    sign_mode = False

    def flush_list():
        nonlocal pending_list
        if pending_list and pending_list['items']:
            blocks.append(pending_list)
        pending_list = None

    for it in items:
        if it['kind'] == 'table':
            flush_list()
            rows = [[m.convert_inline(c) for c in row] for row in it['rows']]
            blocks.append({'t': 'table', 'rows': rows, 'head': True})
            continue
        raw = it['text']
        plain = strip_md(raw).strip()

        # Firma
        if re.fullmatch(r'_{8,}', plain):
            flush_list()
            sign_mode = True
            continue
        if sign_mode:
            continue  # nombre y documento de la firma: los pone el bloque estándar

        # Fecha y lugar
        if phase == 'start' and DATE_LINE.match(plain):
            blocks.append({'t': 'p', 'text': '{{ciudadFirma}}, {{fechaFirmaLarga}}', 'align': 'left'})
            blocks.append({'t': 'space'})
            phase = 'dest'
            continue
        if phase == 'start' and it['align'] == 'center':
            blocks.append({'t': 'p', 'text': m.convert_inline(raw), 'align': 'center'})
            continue

        # Encabezados de sección -> pasos
        h = HEADING.match(plain if plain == strip_md(raw) else raw.strip()) or HEADING.match(plain)
        if h and len(plain) < 90:
            flush_list()
            escoja = None
            phase = 'body'
            title = h.group(2).strip()
            blocks.append({'t': 'h', 'text': f'{h.group(1)}. {title.upper()}'})
            m.open_step(title_case(title))
            continue

        # Destinatario (antes del asunto)
        if phase in ('start', 'dest') and re.match(r'^(Asunto|Referencia|Ref\b|REF|Yo,|Paciente|Accionante|Demandante|Radicado|Proceso|Expediente|Convocante)', plain):
            phase = 'pre'
        if phase in ('start', 'dest'):
            if plain in ('Ciudad', 'Ciudad.', 'E. S. D.', 'E.S.D.'):
                if plain.startswith('Ciudad'):
                    fid = m.add_field({'id': 'dest_ciudad', 'type': 'text', 'label': 'Ciudad de la entidad', 'required': True})
                    blocks.append({'t': 'p', 'text': '{{dest_ciudad}}', 'align': 'left', 'tight': True})
                else:
                    blocks.append({'t': 'p', 'text': plain, 'align': 'left', 'tight': True})
                continue
            line = raw
            if re.match(r'^Dirección:\s*\**XXX\**$', plain):
                if not any(f['id'] == 'dest_direccion' for f in m.fields):
                    m.add_field({'id': 'dest_direccion', 'type': 'text', 'label': 'Dirección de la entidad', 'help': 'Aparece en su página web o en la factura. Puedes dejarla vacía si la envías por correo.'})
                blocks.append({'t': 'p', 'text': 'Dirección: {{dest_direccion}}', 'align': 'left', 'tight': True, 'if': 'dest_direccion'})
                continue
            if re.match(r'^Correo electrónico:\s*\**XXX\**$', plain):
                if not any(f['id'] == 'dest_email' for f in m.fields):
                    m.add_field({'id': 'dest_email', 'type': 'email', 'label': 'Correo de la entidad', 'help': 'Correo de PQRS o de notificaciones judiciales.'})
                blocks.append({'t': 'p', 'text': 'Correo electrónico: {{dest_email}}', 'align': 'left', 'tight': True, 'if': 'dest_email'})
                continue
            opt = re.search(r'\s*\**\(\s*si aplica\s*\)\**', line, re.I)
            if opt:
                # renglón opcional del destinatario (p. ej. «E.S.E. XXX (si aplica)»)
                line = (line[:opt.start()] + line[opt.end():]).strip()
                oid = m.new_id('o')
                m.add_field({'id': oid, 'type': 'checkbox', 'label': f'Incluir en el destinatario: «{strip_md(line).replace("XXX", "…")}»', 'help': 'Márcalo solo si aplica a tu caso.', 'default': False})
                blocks.append({'t': 'p', 'text': m.convert_inline(line, when=oid), 'align': 'left', 'tight': True, 'if': oid})
                continue
            blocks.append({'t': 'p', 'text': m.convert_inline(line), 'align': 'left', 'tight': True})
            continue

        # «Yo, XXX, mayor de edad...» -> datos de la persona
        if YO_STD.search(plain):
            nm = re.sub(r'\*\*', '', raw)
            nm = YO_STD.sub('Yo, **{{nombre}}**, mayor de edad, {{g:identificado(a)}} con {{tipoDoc}} No. {{numDoc}}[[expedicion| expedida en {{expedicion}}]], {{g:domiciliado(a)}} en {{ciudad}}', nm)
            head, sep, tail = nm.partition('{{ciudad}}')
            # en el resto del párrafo, solo lo que se refiere a quien firma (antes de «agente oficioso»)
            # Las palabras «(a)» que se refieren a la persona representada (después de
            # «agente oficioso») se protegen para que no tomen el género de quien firma.
            agent_at = tail.find('agente oficioso')
            if agent_at >= 0:
                tail = tail[:agent_at] + tail[agent_at:].replace('(a)', GMARK)
            text = head + sep + m.convert_inline(tail, gender_all=True).replace(GMARK, '(a)')
            blocks.append({'t': 'p', 'text': balance_bold(text)})
            continue

        # Notificaciones estándar
        if re.match(r'^Dirección física:\s*XXX', plain):
            blocks.append({'t': 'p', 'text': 'Dirección física: {{direccion}}', 'align': 'left', 'tight': True})
            continue
        if re.match(r'^Correo electrónico:\s*XXX', plain) and phase == 'body':
            rest = re.sub(r'^Correo electrónico:\s*XXX\.?\s*', '', plain)
            blocks.append({'t': 'p', 'text': 'Correo electrónico: {{email}}.' + (f' {rest}' if rest else ''), 'align': 'left', 'tight': True})
            continue
        if re.match(r'^(Celular|Teléfono)( o celular)?:\s*XXX$', plain):
            blocks.append({'t': 'p', 'text': 'Celular: {{telefono}}', 'align': 'left', 'tight': True})
            continue
        if plain in ('Atentamente,', 'Cordialmente,', 'Del señor juez,', 'Del señor(a) juez,', 'Respetuosamente,'):
            flush_list()
            blocks.append({'t': 'p', 'text': plain, 'align': 'left'})
            continue

        # Párrafo condicional / elección
        when = None
        cond = COND.match(raw.strip())
        body = raw.strip()
        lm = LIST_NUM.match(strip_md(body)) if not LIST_ALPHA.match(strip_md(body)) else None
        am = LIST_ALPHA.match(strip_md(body))
        is_item = bool(lm or am)
        if lm:
            body = re.sub(r'^\**\d+\.\s*\t?\s*\**', '', body)
        elif am:
            body = re.sub(r'^\**[a-z]\)\s*\t?\s*\**', '', body)
        cond = COND.match(body)
        esc = ESCOJA.match(body)

        if am and escoja:
            # opción de un bloque «Escoja»
            k = escoja['count']
            escoja['count'] += 1
            opt_plain = re.sub(r'\s+', ' ', strip_md(body).replace('XXX', '…'))
            fdef = next(f for f in m.fields if f['id'] == escoja['id'])
            if escoja['multi']:
                fdef['options'].append({'value': str(k), 'label': opt_plain[:140]})
                when = f"{escoja['id']}~{k}"
            else:
                fdef['options'].append({'value': str(k), 'label': opt_plain[:140]})
                when = f"{escoja['id']}={k}"
            text = m.convert_inline(body, when=when)
            if pending_list is None or pending_list.get('style') != 'alpha-sel':
                flush_list()
                pending_list = {'t': 'list', 'style': 'none', 'items': []}
                pending_list['style'] = 'alpha-sel'
            pending_list['items'].append({'text': text, 'if': when})
            continue
        else:
            if escoja and not am:
                escoja = None

        if esc:
            rest = body[esc.end():].strip()
            multi = bool(re.search(r'lo que aplique|si aplica', esc.group(1), re.I))
            label = 'Elige lo que aplica a tu caso' if multi else 'Elige el supuesto de tu caso'
            fid = m.new_id('c')
            f = {'id': fid, 'type': 'checks' if multi else 'radio', 'label': label, 'options': [], 'required': True}
            if not multi:
                f['default'] = '0'
            m.add_field(f)
            if not rest:
                escoja = {'id': fid, 'multi': multi, 'count': 0}
                continue
            # opciones en línea separadas por « / »
            parts = split_top(rest.rstrip('.'))
            items_txt = []
            for k, p in enumerate(parts):
                f['options'].append({'value': str(k), 'label': re.sub(r'\s+', ' ', strip_md(p).replace('XXX', '…'))[:140]})
                w = f'{fid}~{k}' if multi else f'{fid}={k}'
                t = m.convert_inline(p[0].upper() + p[1:] if p else p, when=w)
                items_txt.append({'text': t.rstrip('.') + '.', 'if': w})
            if is_item:
                if pending_list is None:
                    pending_list = {'t': 'list', 'style': 'num', 'items': []}
                for itx in items_txt:
                    pending_list['items'].append(itx)
            else:
                flush_list()
                for itx in items_txt:
                    blocks.append({'t': 'p', 'text': itx['text'], 'if': itx['if']})
            continue

        if cond:
            body = body[cond.end():].strip()
            ctext = cond.group(1).strip()
            snippet = re.sub(r'\s+', ' ', strip_md(body).replace('XXX', '…'))
            snippet = snippet[:110].rsplit(' ', 1)[0] + '…' if len(snippet) > 110 else snippet
            oid = m.new_id('o')
            lbl = f'Incluir: «{snippet}»'
            helptxt = 'Márcalo solo si aplica a tu caso.' if ctext.lower() == 'si aplica' else f'Márcalo si: {ctext[0].lower() + ctext[1:]}.'
            m.add_field({'id': oid, 'type': 'checkbox', 'label': lbl, 'help': helptxt, 'default': False})
            when = oid
            body = body[0].upper() + body[1:] if body else body

        # «(Si aplica)» en medio del párrafo: si lo anterior es un rótulo corto
        # (p. ej. «Prescripción.»), todo el párrafo es opcional; si no, solo el resto.
        mid = re.search(r'\s*\**\(\s*si aplica\s*\)\**\s*', body, re.I) if not cond else None
        inline_opt = None
        if mid:
            head, rest = body[:mid.start()].strip(), body[mid.end():].strip()
            oid = m.new_id('o')
            snippet = re.sub(r'\s+', ' ', strip_md(rest).replace('XXX', '…'))
            snippet = snippet[:110].rsplit(' ', 1)[0] + '…' if len(snippet) > 110 else snippet
            if len(strip_md(head).split()) <= 6:
                m.add_field({'id': oid, 'type': 'checkbox', 'label': f'Incluir: «{strip_md(head)} {snippet}»', 'help': 'Márcalo solo si aplica a tu caso.', 'default': False})
                when = oid
                body = f'{head} {rest}'
            else:
                m.add_field({'id': oid, 'type': 'checkbox', 'label': f'Agregar: «{snippet}»', 'help': 'Márcalo solo si aplica a tu caso.', 'default': False})
                body = head
                inline_opt = (oid, rest)

        text = m.convert_inline(body, when=when)
        if m.pending_escoja:
            m.pending_escoja = False
            fid = m.new_id('c')
            m.add_field({'id': fid, 'type': 'checks', 'label': 'Elige lo que aplica a tu caso', 'options': [], 'required': True}, when)
            escoja = {'id': fid, 'multi': True, 'count': 0}
        if inline_opt:
            oid, rest = inline_opt
            text += f' [[{oid}|' + m.convert_inline(rest, when=oid) + ']]'
        if is_item:
            if pending_list is None or pending_list['style'] != 'num':
                flush_list()
                pending_list = {'t': 'list', 'style': 'num', 'items': []}
            pending_list['items'].append({'text': text, 'if': when} if when else text)
        else:
            flush_list()
            align = 'center' if it['align'] == 'center' else ('left' if phase != 'body' or len(plain) < 60 else 'justify')
            blk = {'t': 'p', 'text': text, 'align': align}
            if when:
                blk['if'] = when
            blocks.append(blk)
    flush_list()

    # lista de selección «a) b)»: sin viñeta
    for b in blocks:
        if b.get('t') == 'list' and b.get('style') == 'alpha-sel':
            b['style'] = 'plain'

    # Firma estándar
    blocks.append({'t': 'sign', 'lines': ['**{{nombre|upper}}**', '{{docAbbr}} {{numDoc}}[[expedicion| de {{expedicion}}]]']})

    # Etiquetas curadas
    for f in m.fields:
        ov = m.labels_override.get(f['id'])
        if isinstance(ov, str):
            f['label'] = ov
        elif isinstance(ov, dict):
            f.update(ov)
    return m

# --------------------------------------------------------------------------
# Salida
# --------------------------------------------------------------------------

def slugify(text, limit=60):
    """«Reclamo ante la EPS por autorización…» -> «reclamo-ante-la-eps-por-autorizacion…» (URL de la minuta)."""
    import unicodedata
    t = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode().lower()
    t = re.sub(r'[^a-z0-9]+', '-', t).strip('-')
    if len(t) > limit:
        t = t[:limit].rsplit('-', 1)[0]
    return t


def js(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


def main():
    meta_all = json.load(open(META, encoding='utf-8')) if os.path.exists(META) else {}
    report = '--report' in sys.argv
    index = {a: [] for a in AREAS.values()}
    seen = set()
    for folder, area in AREAS.items():
        d = os.path.join(SRC, folder)
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith('.docx'):
                continue
            base = re.sub(r'\s*\(\d+\)', '', f[:-5])
            code = base.split('_', 1)[0]
            if 'Guia' in base or (area, code) in seen:
                continue
            seen.add((area, code))
            key = f'{area}/{code}'
            meta = meta_all.get(key, {})
            items = read_docx(os.path.join(d, f))
            mm = convert(code, items, meta)
            mid = f"{area}-{code.lower()}"
            title = meta.get('title') or base.split('_', 1)[1].replace('_', ' ')
            data = {
                'id': mid, 'code': code, 'area': area, 'title': title,
                'notes': sorted(set(mm.notes)),
                'steps': [s for s in mm.steps if s['fields']],
                'fields': mm.fields,
                'blocks': mm.blocks,
            }
            os.makedirs(os.path.join(OUT, area), exist_ok=True)
            with open(os.path.join(OUT, area, f'{code.lower()}.js'), 'w', encoding='utf-8', newline='\n') as fh:
                fh.write(f'// Generado por tools/import_minutas.py desde «{f}». No editar a mano: edita la minuta o tools/minutas_meta.json.\n')
                fh.write('export default ' + js(data) + ';\n')
            slug = meta.get('slug') or slugify(title)
            used = {e['slug'] for e in index[area]}
            if slug in used:
                slug = f"{slug}-{code.lower()}"
            entry = {'id': mid, 'code': code, 'area': area, 'slug': slug, 'title': title, 'fields': len(mm.fields)}
            for k in ('summary', 'plan', 'stage', 'channels', 'entity', 'icon', 'situation', 'deadline', 'tags', 'confidential', 'lawyer'):
                if k in meta:
                    entry[k] = meta[k]
            index[area].append(entry)
            if report:
                print(f'\n### {key} — {title} ({len(mm.fields)} campos)')
                for fl in mm.fields:
                    extra = f" [{fl['type']}]" if fl['type'] != 'text' else ''
                    opts = (' {' + ' | '.join(o['label'][:40] for o in fl.get('options', [])) + '}') if fl.get('options') else ''
                    print(f"  {fl['id']}{extra}: {fl['label']}{opts}")
    for area, entries in index.items():
        with open(os.path.join(OUT, area, 'index.js'), 'w', encoding='utf-8', newline='\n') as fh:
            fh.write('// Generado por tools/import_minutas.py. Índice liviano: el contenido se carga al abrir cada minuta.\n')
            fh.write('export default ' + js(entries) + ';\n')
    print('Minutas importadas:', {a: len(e) for a, e in index.items()})


if __name__ == '__main__':
    main()
