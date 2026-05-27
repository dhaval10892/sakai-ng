"""
Generates agile-project-roadmap.docx — humanized version, OOXML-compliant.
Run: python3 build_docx.py
"""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# OOXML CT_PPrBase required child element order (ECMA-376 §17.3.1.26)
_PPR_ORDER = [
    'pStyle', 'keepNext', 'keepLines', 'pageBreakBefore', 'framePr',
    'suppressLineNumbers', 'pBdr', 'shd', 'tabs', 'suppressAutoHyphens',
    'kinsoku', 'wordWrap', 'overflowPunct', 'topLinePunct', 'autoSpaceDE',
    'autoSpaceAN', 'bidi', 'adjustRightInd', 'snapToGrid', 'spacing', 'ind',
    'contextualSpacing', 'mirrorIndents', 'suppressOverlap', 'jc',
    'textDirection', 'textAlignment', 'textboxTightWrap', 'outlineLvl',
    'divId', 'cnfStyle', 'rPr', 'sectPr', 'pPrChange',
]

def _tag_name(elem):
    tag = elem.tag
    return tag.split('}')[1] if '}' in tag else tag

def _sort_key(elem):
    name = _tag_name(elem)
    try:
        return _PPR_ORDER.index(name)
    except ValueError:
        return len(_PPR_ORDER)

def _reorder_ppr(pPr):
    """Sort pPr children into OOXML-required order so LibreOffice accepts the file."""
    children = list(pPr)
    for child in children:
        pPr.remove(child)
    for child in sorted(children, key=_sort_key):
        pPr.append(child)


doc = Document()

for sec in doc.sections:
    sec.top_margin    = Inches(1)
    sec.bottom_margin = Inches(1)
    sec.left_margin   = Inches(1)
    sec.right_margin  = Inches(1)

doc.styles['Normal'].font.name = 'Times New Roman'
doc.styles['Normal'].font.size = Pt(12)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _apply_spacing(para, before=0, after=6, line=240):
    """Add w:spacing to pPr (removes old one first). Call AFTER all other pPr edits."""
    pf = para.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after  = Pt(after)
    pPr = para._p.get_or_add_pPr()
    for old in pPr.findall(qn('w:spacing')):
        pPr.remove(old)
    ls = OxmlElement('w:spacing')
    ls.set(qn('w:line'),     str(line))
    ls.set(qn('w:lineRule'), 'auto')
    pPr.append(ls)
    _reorder_ppr(pPr)   # ← ensure correct order every time


def add_run(para, text, bold=False, italic=False, size=12, color=None):
    run = para.add_run(text)
    run.bold = bold; run.italic = italic
    run.font.name = 'Times New Roman'
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    return run


def body(text, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p = doc.add_paragraph()
    p.alignment = align
    add_run(p, text, bold=bold, italic=italic)
    _apply_spacing(p, before=0, after=6)   # reorders pPr at end
    return p


def h1(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    add_run(p, text.upper(), bold=True, size=13)
    # Add bottom border to pPr
    pPr  = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot  = OxmlElement('w:bottom')
    bot.set(qn('w:val'),   'single'); bot.set(qn('w:sz'),    '8')
    bot.set(qn('w:space'), '1');      bot.set(qn('w:color'), '000000')
    pBdr.append(bot)
    pPr.append(pBdr)
    _apply_spacing(p, before=14, after=6)  # reorders pPr, pBdr ends up before spacing
    return p


def h2(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    add_run(p, text, bold=True, size=12)
    _apply_spacing(p, before=10, after=4)
    return p


def h3(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    add_run(p, text, bold=True, italic=True, size=12)
    _apply_spacing(p, before=8, after=4)
    return p


def bul(text, prefix=None):
    p  = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent  = Inches(0.25)
    p.paragraph_format.space_after  = Pt(3)
    p.paragraph_format.space_before = Pt(0)
    if prefix:
        add_run(p, prefix + ': ', bold=True)
    add_run(p, text)
    _reorder_ppr(p._p.get_or_add_pPr())
    return p


def _shade_cell(cell, hex_fill='1A1A1A'):
    tcPr = cell._tc.get_or_add_tcPr()
    for old in tcPr.findall(qn('w:shd')):
        tcPr.remove(old)
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_fill)
    tcPr.append(shd)


def th(cell, text):
    cell.text = ''
    _shade_cell(cell)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    add_run(p, text, bold=True, size=11, color=RGBColor(0xFF, 0xFF, 0xFF))


def td(cell, text, size=11):
    cell.text = ''
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    add_run(p, text, size=size)


def make_table(data, col_widths, data_size=11):
    tbl = doc.add_table(rows=len(data), cols=len(data[0]))
    tbl.style = 'Table Grid'
    tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
    for r_i, row_data in enumerate(data):
        row = tbl.rows[r_i]
        for c_i, text in enumerate(row_data):
            cell = row.cells[c_i]
            cell.width = col_widths[c_i]
            if r_i == 0:
                th(cell, text)
            else:
                td(cell, text, size=data_size)
    doc.add_paragraph()
    return tbl


# ════════════════════════════════════════════════════════════════════════════
# COVER
# ════════════════════════════════════════════════════════════════════════════
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
add_run(p, 'AGILE PROJECT ROADMAP', bold=True, size=16)
_apply_spacing(p, before=0, after=4)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
add_run(p, 'UrbanRoots: A Hyperlocal Farm-to-Consumer Digital Marketplace',
        italic=True, size=13)
_apply_spacing(p, before=0, after=4)

p = doc.add_paragraph()
pPr  = p._p.get_or_add_pPr()
pBdr = OxmlElement('w:pBdr')
bot  = OxmlElement('w:bottom')
bot.set(qn('w:val'),   'single'); bot.set(qn('w:sz'),    '12')
bot.set(qn('w:space'), '1');      bot.set(qn('w:color'), '000000')
pBdr.append(bot)
pPr.append(pBdr)
_apply_spacing(p, before=4, after=4)

for label, value in [
    ('Project Type', 'Start-Up Venture'),
    ('Framework',    'Agile \u2013 Scrum'),
    ('Prepared by',  '[Student Name]'),
    ('Course',       'Agile Project Management'),
    ('Date',         'May 2026'),
]:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_run(p, label + ': ', bold=True)
    add_run(p, value)
    _apply_spacing(p, before=0, after=3)

doc.add_paragraph()


# ════════════════════════════════════════════════════════════════════════════
# 1. PROJECT DESCRIPTION
# ════════════════════════════════════════════════════════════════════════════
h1('1. Project Description')

body(
    'UrbanRoots is a mobile-first digital marketplace connecting local farmers and small '
    'food producers directly with city consumers. Despite growing consumer demand for '
    'locally sourced food, buying it remains genuinely inconvenient: farmers\u2019 markets '
    'operate a few hours per week, CSA programmes require months-long commitments, and '
    'mainstream grocery delivery platforms are dominated by national distributors whose '
    'products travel hundreds of kilometres before reaching a household. UrbanRoots closes '
    'that gap through a two-sided platform where producers get a simple digital storefront '
    'and order management tools, and consumers get a browsable app to discover nearby '
    'farms, view seasonal availability, and schedule delivery or pickup. The pilot will '
    'launch in one Canadian city before the team evaluates expansion.'
)
body(
    'The final product is not fully defined yet \u2014 the right mix of subscription '
    'models, logistics partnerships, and onboarding support will emerge from real user '
    'behaviour, not upfront assumptions. This is precisely why Agile is the appropriate '
    'framework for this project.'
)

h2('Problem / Opportunity Statement')
body(
    'Most urban Canadians say they want to buy local food but don\u2019t, because '
    'convenient access doesn\u2019t exist (Statistics Canada, 2023). Meanwhile, '
    'small-scale producers spend significant time on logistics and marketing they didn\u2019t '
    'sign up for. UrbanRoots addresses both sides: making local food as easy to buy as any '
    'grocery app, while keeping revenue with the people growing it.'
)


# ════════════════════════════════════════════════════════════════════════════
# 2. VISION STATEMENT
# ════════════════════════════════════════════════════════════════════════════
h1('2. Vision Statement')

body(
    '\u201cA Canada where buying food from a farm 20 kilometres away is just as easy, '
    'reliable, and affordable as buying from a national grocery chain \u2014 and where '
    'the farmer earns a fair return for growing it.\u201d',
    italic=True
)
body(
    'The long-term ambition is a meaningful shift in how urban food systems work: local '
    'producers with a revenue channel they can plan around, consumers who buy local by '
    'default rather than occasionally, and supply chains with less waste and a smaller '
    'carbon footprint. Success will be measured not only in transactions but in producer '
    'income growth and community food resilience.'
)


# ════════════════════════════════════════════════════════════════════════════
# 3. MVP
# ════════════════════════════════════════════════════════════════════════════
h1('3. Minimum Viable Product (MVP)')

body(
    'The MVP is a fully functional but narrowly scoped version of the platform, designed '
    'to run a six-week beta with 12\u201315 producers and 250\u2013300 consumers in one '
    'city. The goal is not a polished final product \u2014 it is learning whether the '
    'core experience works before committing to building more.'
)

h2('MVP Features')
bul('Simple producer storefront: bio, photos, and production notes.', 'Producer profiles')
bul('Product listings with pricing and availability; consumers browse by category or proximity.', 'Product catalogue')
bul('Cart, delivery or pickup slot selection, and Stripe payment \u2014 completable in under two minutes.', 'Order and checkout')
bul('Producers or a partner courier confirm and track deliveries within a 20 km radius.', 'Delivery scheduling')
bul('Order history and one-tap re-order for repeat purchases.', 'Consumer account')
bul('Real-time incoming orders, fulfilment status, and basic sales figures for producers.', 'Producer dashboard')


# ════════════════════════════════════════════════════════════════════════════
# 4. ROADMAP
# ════════════════════════════════════════════════════════════════════════════
h1('4. Roadmap')

h2('4.1  Agile Framework and Team Structure')
body(
    'UrbanRoots uses the Scrum framework because the end state is not fully defined and '
    'the team must be able to reprioritize based on real user feedback (Schwaber & '
    'Sutherland, 2020). The Scrum team comprises a Product Owner, Scrum Master, a '
    'cross-functional Development Team (two front-end developers, one back-end developer, '
    'one UX/UI designer, one QA engineer), and Stakeholders including pilot producers, '
    'early-adopter consumers, and a logistics partner representative.'
)

h2('4.2  Product Backlog')
make_table(
    data=[
        ('#', 'User Story', 'Priority', 'Sprint Target'),
        ('1', 'As a consumer, I want to browse local producers by distance so I can find farms near me.', 'High', 'Sprint 1'),
        ('2', 'As a producer, I want to create a storefront profile so consumers can learn about my farm.', 'High', 'Sprint 1'),
        ('3', 'As a consumer, I want to add products to a cart and check out securely.', 'High', 'Sprint 2'),
        ('4', 'As a producer, I want to see and manage my incoming orders on a dashboard.', 'High', 'Sprint 2'),
        ('5', 'As a consumer, I want to pick a delivery or pickup window that fits my schedule.', 'High', 'Sprint 2'),
        ('6', 'As a QA engineer, I want automated regression tests on every build.', 'Medium', 'Sprint 3'),
        ('7', 'As a consumer, I want to re-order my last purchase in one tap.', 'Medium', 'Sprint 3'),
        ('8', 'As a consumer, I want a weekly produce subscription to reduce decision fatigue.', 'Low', 'Post-MVP'),
        ('9', 'As a producer, I want a demand forecast tool to plan planting more accurately.', 'Low', 'Post-MVP'),
    ],
    col_widths=[Inches(0.32), Inches(3.85), Inches(0.82), Inches(1.01)],
)

h2('4.3  Sprint Overview')
tbl2 = doc.add_table(rows=1, cols=3)
tbl2.style = 'Table Grid'
tbl2.alignment = WD_TABLE_ALIGNMENT.LEFT
sprint_info = [
    ('SPRINT 1', 'Foundation & Discovery', 'Weeks 1\u20138',
     ['User & producer interviews', 'Sitemap & architecture',
      'Wireframes & design system', 'Producer profile (staging)']),
    ('SPRINT 2', 'MVP Development', 'Weeks 9\u201316',
     ['Product catalogue & cart', 'Checkout & Stripe payment',
      'Producer order dashboard', 'Delivery scheduling module']),
    ('SPRINT 3', 'Testing, Optimization & Launch', 'Weeks 17\u201324',
     ['Six-week beta with real users', 'Accessibility & performance tests',
      'Bug fixes from beta feedback', 'App store submission & launch']),
]
for c_i, (num, name, weeks, items) in enumerate(sprint_info):
    cell = tbl2.rows[0].cells[c_i]
    cell.width = Inches(2.17)
    cell.text = ''
    p1 = cell.paragraphs[0]
    add_run(p1, num, bold=True, size=9, color=RGBColor(0x55, 0x55, 0x55))
    p2 = cell.add_paragraph(); add_run(p2, name, bold=True, size=11)
    p3 = cell.add_paragraph()
    add_run(p3, weeks, italic=True, size=10, color=RGBColor(0x44, 0x44, 0x44))
    for item in items:
        pi = cell.add_paragraph(style='List Bullet')
        pi.paragraph_format.left_indent = Inches(0.15)
        add_run(pi, item, size=10)
        _reorder_ppr(pi._p.get_or_add_pPr())
doc.add_paragraph()

h3('Sprint 1: Foundation & Discovery (Weeks 1\u20138)')
body(
    'Structured interviews with 20 consumers and 10 prospective producers inform every '
    'design decision before any code is written. Deliverables: technical architecture '
    'decision (React Native, Node.js/PostgreSQL), sitemap, wireframes, and the producer '
    'profile feature deployed to staging.'
)
body('User Stories and Acceptance Criteria:', bold=True)
bul('\u201cAs a consumer, I want to browse local producers by distance.\u201d \u2014 '
    'Done when: producers listed by proximity; geolocation works on iOS and Android without errors.')
bul('\u201cAs a producer, I want to create a storefront profile.\u201d \u2014 '
    'Done when: producer registers, publishes profile, visible to consumers within five minutes.')

h3('Sprint 2: MVP Development (Weeks 9\u201316)')
body(
    'Builds the transactional core: product catalogue, cart, Stripe checkout, producer '
    'order dashboard, and delivery scheduling. Accessibility to WCAG 2.1 AA is tested '
    'throughout, not deferred to Sprint 3.'
)
body('User Stories and Acceptance Criteria:', bold=True)
bul('\u201cAs a consumer, I want to add products to a cart and check out securely.\u201d '
    '\u2014 Done when: Stripe payment succeeds in test environment; confirmation email '
    'arrives within 60 seconds; no card data stored on our servers.')
bul('\u201cAs a producer, I want to see and manage my incoming orders.\u201d \u2014 '
    'Done when: orders appear on dashboard within 30 seconds; producer can mark each '
    'confirmed, in progress, or fulfilled.')

h3('Sprint 3: Testing, Optimization & Beta Launch (Weeks 17\u201324)')
body(
    'The live beta runs for six weeks with the full cohort. Sprint Reviews draw directly '
    'from user feedback; the backlog is re-prioritized after each one. Buffer is '
    'intentionally built in \u2014 surprises during a beta are expected, not exceptional.'
)
body('User Stories and Acceptance Criteria:', bold=True)
bul('\u201cAs a QA engineer, I want automated regression tests on every build.\u201d '
    '\u2014 Done when: suite covers 80% of critical paths; all tests pass before any '
    'production deployment.')

h2('4.4  Scrum Ceremonies (All Sprints)')
bul('Backlog items selected, effort estimated in story points, sprint goal set.', 'Sprint Planning')
bul('15-minute daily stand-up: what\u2019s done, what\u2019s next, what\u2019s blocking.', 'Daily Scrum')
bul('End-of-sprint demo to stakeholders; feedback updates the backlog immediately.', 'Sprint Review')
bul('Team reflection on what to keep, stop, and improve for the next sprint.', 'Sprint Retrospective')

h2('4.5  Risk Management')
make_table(
    data=[
        ('Risk', 'Likelihood', 'Impact', 'Mitigation'),
        ('Provincial food safety laws may restrict direct producer-to-consumer sales',
         'Medium', 'High',
         'Food-law consultant engaged in Sprint 1; province-specific compliance flags built in from day one.'),
        ('Low producer adoption due to digital literacy barriers',
         'Medium', 'High',
         'Hands-on onboarding workshops; dedicated producer success contact for the beta period.'),
        ('Last-mile delivery logistics more complex than anticipated',
         'High', 'Medium',
         'Partner with existing local courier; delivery radius capped at 20 km for MVP.'),
        ('Scope creep from mid-sprint stakeholder requests',
         'High', 'Medium',
         'All new requests enter the backlog; nothing added to a sprint in progress.'),
        ('Payment security vulnerabilities exposing consumer data',
         'Low', 'High',
         "Stripe\u2019s fully managed infrastructure used; third-party security audit before beta launch."),
    ],
    col_widths=[Inches(2.0), Inches(0.78), Inches(0.67), Inches(2.55)],
)

h2('4.6  Success Measures')
bul('App live on iOS and Google Play by end of Sprint 3, no critical open bugs')
bul('At least 12 active producer storefronts at beta launch')
bul('Minimum 200 completed consumer transactions during the six-week beta')
bul('Consumer app rating averaging 4.0 or higher; producer NPS of +30 or higher')
bul('System uptime at 99% or above throughout the beta period')

h2('4.7  Future Enhancements (Post-MVP)')
bul('Weekly subscription produce boxes personalized by purchase history')
bul('AI-driven demand forecasting dashboard for producers to optimize planting cycles')
bul('B2B channel for restaurants, schools, and food co-operatives')


# ════════════════════════════════════════════════════════════════════════════
# REFERENCES
# ════════════════════════════════════════════════════════════════════════════
h1('References')
for ref in [
    'Cohn, M. (2004). User stories applied: For agile software development. Addison-Wesley.',
    'Fowler, M., & Highsmith, J. (2001). The agile manifesto. Software Development, 9(8), 28\u201335.',
    'Ries, E. (2011). The lean startup: How today\u2019s entrepreneurs use continuous innovation to create radically successful businesses. Crown Business.',
    'Schwaber, K., & Sutherland, J. (2020). The Scrum guide: The definitive guide to Scrum \u2014 the rules of the game. Scrum.org. https://scrumguides.org/scrum-guide.html',
    'Statistics Canada. (2023). Food security and local food purchases: 2022 Canadian Community Health Survey supplement. Government of Canada. https://www.statcan.gc.ca',
]:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent       = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.5)
    p.paragraph_format.space_after       = Pt(6)
    add_run(p, ref)


# ════════════════════════════════════════════════════════════════════════════
# APPENDIX A
# ════════════════════════════════════════════════════════════════════════════
doc.add_page_break()
h1('Appendix A \u2013 Detailed Sprint Schedule')
make_table(
    data=[
        ('Sprint Cycle', 'Weeks', 'Sprint Goal', 'Key Deliverables'),
        ('Sprint 1 \u2013 Cycle 1', '1\u20132', 'Complete user research',
         '20 consumer interviews; 10 producer interviews; research synthesis report'),
        ('Sprint 1 \u2013 Cycle 2', '3\u20134', 'Finalize information architecture',
         'Sitemap; navigation taxonomy; content inventory'),
        ('Sprint 1 \u2013 Cycle 3', '5\u20136', 'Wireframes and design system signed off',
         'Low- and mid-fidelity wireframes; typography, colour, and component library'),
        ('Sprint 1 \u2013 Cycle 4', '7\u20138', 'Producer profile live in staging',
         'Producer registration flow; profile display page; internal QA sign-off'),
        ('Sprint 2 \u2013 Cycle 1', '9\u201310', 'Product catalogue functional',
         'Category browsing; product detail pages; producer inventory management'),
        ('Sprint 2 \u2013 Cycle 2', '11\u201312', 'Cart and checkout complete',
         'Cart flow; Stripe integration; order confirmation emails'),
        ('Sprint 2 \u2013 Cycle 3', '13\u201314', 'Producer dashboard and delivery scheduling',
         'Order management dashboard; delivery slot booking module'),
        ('Sprint 2 \u2013 Cycle 4', '15\u201316', 'Internal UAT and accessibility review',
         'WCAG 2.1 AA audit; open bugs resolved; consumer account screen complete'),
        ('Sprint 3 \u2013 Cycle 1', '17\u201318', 'Beta cohort onboarded',
         '12 producers live; 250 consumer accounts active; monitoring dashboards running'),
        ('Sprint 3 \u2013 Cycle 2', '19\u201320', 'First beta feedback loop complete',
         'Sprint Review with beta participants; top 5 friction points addressed'),
        ('Sprint 3 \u2013 Cycle 3', '21\u201322', 'Performance and security hardening',
         'Load test complete; third-party security audit done; re-order feature shipped'),
        ('Sprint 3 \u2013 Cycle 4', '23\u201324', 'Soft public launch',
         'App store approval; 10 more producers onboarded; launch retrospective held'),
    ],
    col_widths=[Inches(1.38), Inches(0.5), Inches(1.82), Inches(2.3)],
    data_size=10,
)


# ════════════════════════════════════════════════════════════════════════════
# SAVE + VALIDATE
# ════════════════════════════════════════════════════════════════════════════
output = '/workspace/agile-project-roadmap.docx'
doc.save(output)

# Quick self-validation: check element ordering
from lxml import etree
import zipfile as zf
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
with zf.ZipFile(output) as z:
    root = etree.fromstring(z.read('word/document.xml'))
bad = sum(
    1 for pPr in root.iter(f'{{{W}}}pPr')
    if ('spacing' in [c.tag.split('}')[1] for c in pPr] and
        'jc'      in [c.tag.split('}')[1] for c in pPr] and
        [c.tag.split('}')[1] for c in pPr].index('spacing') >
        [c.tag.split('}')[1] for c in pPr].index('jc'))
)
print(f'Saved: {output}')
print(f'Ordering violations (spacing after jc): {bad}  <- must be 0')
