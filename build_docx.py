"""
Generates agile-project-roadmap.docx from scratch using python-docx.
Run: python3 build_docx.py
"""
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

doc = Document()

# ── Page margins: 1 inch all sides ──────────────────────────────────────────
for section in doc.sections:
    section.top_margin    = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin   = Inches(1)
    section.right_margin  = Inches(1)

# ── Default body style ───────────────────────────────────────────────────────
style = doc.styles['Normal']
font  = style.font
font.name = 'Times New Roman'
font.size = Pt(12)

# ── Helper: set paragraph spacing ───────────────────────────────────────────
def set_spacing(para, before=0, after=6, line=1.0):
    pf = para.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after  = Pt(after)
    from docx.shared import Pt as pt_
    from docx.oxml.ns import qn as q_
    # single spacing
    pPr = para._p.get_or_add_pPr()
    lSpacing = OxmlElement('w:spacing')
    lSpacing.set(q_('w:line'),    str(int(240 * line)))
    lSpacing.set(q_('w:lineRule'), 'auto')
    pPr.append(lSpacing)

def body(text, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p = doc.add_paragraph()
    p.alignment = align
    run = p.add_run(text)
    run.bold   = bold
    run.italic = italic
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    set_spacing(p, before=0, after=6)
    return p

def heading1(text):
    """Section heading — all caps, bold, 13pt, bottom border."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text.upper())
    run.bold = True
    run.font.name = 'Times New Roman'
    run.font.size = Pt(13)
    set_spacing(p, before=14, after=6)
    # bottom border
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'),   'single')
    bottom.set(qn('w:sz'),    '8')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '000000')
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p

def heading2(text):
    """Sub-section heading — bold 12pt."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    run.bold = True
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    set_spacing(p, before=10, after=4)
    return p

def heading3(text):
    """Sprint label — bold italic 12pt."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    run.bold   = True
    run.italic = True
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    set_spacing(p, before=8, after=4)
    return p

def bullet(text, bold_prefix=None):
    """Bullet list item, optional bold prefix before em-dash."""
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = p.paragraph_format
    pf.left_indent   = Inches(0.25)
    pf.space_after   = Pt(3)
    pf.space_before  = Pt(0)
    if bold_prefix:
        r1 = p.add_run(bold_prefix + ': ')
        r1.bold = True
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(12)
        r2 = p.add_run(text)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(12)
    else:
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
    return p

def shade_row(row, hex_color='1A1A1A'):
    """Fill a table row with a background colour."""
    for cell in row.cells:
        tc   = cell._tc
        tcPr = tc.get_or_add_tcPr()
        shd  = OxmlElement('w:shd')
        shd.set(qn('w:val'),   'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'),  hex_color)
        tcPr.append(shd)

def table_header_cell(cell, text, white=True):
    cell.text = ''
    p = cell.paragraphs[0]
    run = p.add_run(text)
    run.bold = True
    run.font.name = 'Times New Roman'
    run.font.size = Pt(11)
    if white:
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT

def table_cell(cell, text, bold=False, italic=False, size=11):
    cell.text = ''
    p = cell.paragraphs[0]
    run = p.add_run(text)
    run.bold   = bold
    run.italic = italic
    run.font.name = 'Times New Roman'
    run.font.size = Pt(size)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT

# ════════════════════════════════════════════════════════════════════════════
# COVER BLOCK
# ════════════════════════════════════════════════════════════════════════════
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('AGILE PROJECT ROADMAP')
r.bold = True; r.font.size = Pt(16); r.font.name = 'Times New Roman'
set_spacing(p, before=0, after=4)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('UrbanRoots: A Hyperlocal Farm-to-Consumer Digital Marketplace')
r.italic = True; r.font.size = Pt(13); r.font.name = 'Times New Roman'
set_spacing(p, before=0, after=4)

# Horizontal rule via bottom border on a blank paragraph
p = doc.add_paragraph()
set_spacing(p, before=4, after=4)
pPr = p._p.get_or_add_pPr()
pBdr = OxmlElement('w:pBdr')
bot  = OxmlElement('w:bottom')
bot.set(qn('w:val'),   'single'); bot.set(qn('w:sz'), '12')
bot.set(qn('w:space'), '1');      bot.set(qn('w:color'), '000000')
pBdr.append(bot); pPr.append(pBdr)

for label, value in [
    ('Project Type', 'Start-Up Venture'),
    ('Framework',    'Agile – Scrum'),
    ('Prepared by',  '[Student Name]'),
    ('Date',         'May 2026'),
]:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p.add_run(label + ': '); r1.bold = True
    r1.font.name = 'Times New Roman'; r1.font.size = Pt(12)
    r2 = p.add_run(value)
    r2.font.name = 'Times New Roman'; r2.font.size = Pt(12)
    set_spacing(p, before=0, after=3)

doc.add_paragraph()  # spacer

# ════════════════════════════════════════════════════════════════════════════
# SECTION 1 – PROJECT DESCRIPTION
# ════════════════════════════════════════════════════════════════════════════
heading1('1. Project Description')

body(
    'UrbanRoots is a proposed mobile-first digital marketplace that connects small-scale local '
    'farmers, urban food producers, and home gardeners directly with city-based consumers. The '
    'platform is designed to address a persistent friction point in the local food system: despite '
    'strong and growing consumer interest in purchasing locally sourced food, most urban households '
    'have no practical, convenient way to discover or regularly buy from nearby producers. '
    'Farmers\u2019 markets operate only a few hours per week, community-supported agriculture (CSA) '
    'programmes require months-long commitments, and general grocery delivery platforms are dominated '
    'by national distributors whose products can travel hundreds or thousands of kilometres before '
    'reaching a consumer\u2019s table.'
)

body(
    'UrbanRoots aims to close this gap by building a two-sided marketplace: producers gain a '
    'low-cost digital storefront with order management tools, while consumers gain an intuitive '
    'browsing and checkout experience, flexible subscription options, and transparent supply-chain '
    'information (e.g., distance from farm, harvest date, and production practices). The platform '
    'will initially be piloted in one mid-sized Canadian metropolitan area before evaluating expansion.'
)

body(
    'The project is fundamentally exploratory. Consumer behaviour around local food is highly '
    'variable, provincial regulations for direct food sales differ, and the optimal mix of logistics, '
    'subscription models, and producer onboarding remains undetermined. These conditions make Agile '
    'the appropriate framework: the product must evolve based on real user feedback rather than a '
    'fixed upfront specification.'
)

heading2('Problem / Opportunity Statement')
body(
    'Urban consumers increasingly want to know where their food originates, yet the infrastructure '
    'connecting them with local producers remains fragmented and inconvenient. Small-scale farmers '
    'simultaneously face significant barriers to direct-to-consumer sales: limited digital tools, '
    'minimal marketing capacity, and no logistics infrastructure. UrbanRoots addresses both sides '
    'of this market failure through a purpose-built digital platform.'
)

# ════════════════════════════════════════════════════════════════════════════
# SECTION 2 – VISION STATEMENT
# ════════════════════════════════════════════════════════════════════════════
heading1('2. Vision Statement')

p = body(
    '\u201cTo build a trusted and thriving local food ecosystem where every urban household can '
    'access fresh, locally grown food within 24 hours of harvest, while empowering small-scale '
    'farmers and food producers to sustain viable livelihoods through direct, dignified, and '
    'technology-enabled commerce.\u201d',
    italic=True
)

body(
    'Over the long term, UrbanRoots will become the default infrastructure layer for hyperlocal '
    'food distribution in Canadian cities\u2014as familiar and reliable as mainstream grocery '
    'delivery, yet deeply rooted in local community and ecological sustainability. Success will be '
    'measured not only by transaction volume, but by producer income growth, food waste reduction, '
    'and local food network resilience.'
)

# ════════════════════════════════════════════════════════════════════════════
# SECTION 3 – MINIMUM VIABLE PRODUCT
# ════════════════════════════════════════════════════════════════════════════
heading1('3. Minimum Viable Product (MVP)')

body(
    'The MVP for UrbanRoots is a functional web and mobile application (iOS and Android) that '
    'allows a curated group of local producers to list products and receive orders, and a cohort '
    'of early adopter consumers to browse, purchase, and schedule delivery or pickup. The MVP is '
    'intentionally narrow in scope: it will not attempt to solve every aspect of local food '
    'distribution, but will instead validate the core value proposition\u2014that a well-designed '
    'digital experience can reliably connect urban consumers with nearby producers in a repeatable, '
    'satisfying way.'
)

heading2('MVP Features')
bullet('A simple onboarding flow allowing producers to create a storefront with a short bio, photos, and a description of their production practices.', 'Producer profiles')
bullet('Producers can list available products with pricing, quantity limits, and expected availability windows. Consumers can browse by product category or location.', 'Product catalogue')
bullet('Consumers can add items to a cart, select a delivery or pickup slot, and complete payment via integrated payment gateway (Stripe).', 'Order and checkout flow')
bullet('A basic logistics tool allowing producers or a contracted courier to confirm and track deliveries within a defined urban zone.', 'Delivery scheduling module')
bullet('Registered consumers can view past orders, re-order frequently purchased items, and manage account settings.', 'Consumer account and order history')
bullet('A simple backend dashboard giving producers a real-time view of incoming orders, fulfilment status, and basic sales analytics.', 'Producer order dashboard')

body(
    'The MVP will be deployed to a pilot cohort of 12\u201315 producers and approximately '
    '250\u2013300 consumers in a single metropolitan area over a six-week beta period. Feedback '
    'from this cohort will directly inform the product backlog for subsequent development cycles.'
)

# ════════════════════════════════════════════════════════════════════════════
# SECTION 4 – ROADMAP
# ════════════════════════════════════════════════════════════════════════════
heading1('4. Roadmap')

# 4.1 Framework
heading2('4.1  Agile Framework and Team Structure')
body(
    'UrbanRoots will be developed using the Scrum framework. Scrum was selected because the end '
    'state of the product is not fully defined, consumer behaviour in this space is difficult to '
    'predict without real-world data, and the team needs the ability to re-prioritize rapidly '
    'based on sprint reviews and stakeholder feedback (Schwaber & Sutherland, 2020). The Scrum '
    'team will comprise the following roles:'
)
bullet('Responsible for maintaining and prioritizing the product backlog, representing the interests of consumers, producers, and investors.', 'Product Owner')
bullet('Facilitates all Scrum ceremonies, removes impediments, and coaches the team on Agile best practices.', 'Scrum Master')
bullet('A cross-functional team of two front-end developers, one back-end developer, one UX/UI designer, and one QA engineer.', 'Development Team')
bullet('Pilot producers, early-adopter consumer testers, and a logistics partner representative who participate in Sprint Reviews.', 'Stakeholders')

# 4.2 Product Backlog table
heading2('4.2  Product Backlog')
body(
    'The product backlog represents the full universe of features and improvements identified at '
    'project inception. Items are ordered by priority based on customer value, technical '
    'dependency, and risk reduction. The backlog will be continuously refined throughout the project.'
)

backlog_data = [
    ('#', 'Backlog Item (User Story)', 'Priority', 'Sprint Target'),
    ('1', 'As a consumer, I want to browse local producers by distance so I can find farms near me.', 'High', 'Sprint 1'),
    ('2', 'As a producer, I want to create a storefront profile so consumers can learn about my farm.', 'High', 'Sprint 1'),
    ('3', 'As a consumer, I want to add products to a cart and check out securely so I can place an order.', 'High', 'Sprint 2'),
    ('4', 'As a producer, I want to receive and manage incoming orders on a dashboard so I can fulfil them efficiently.', 'High', 'Sprint 2'),
    ('5', 'As a consumer, I want to schedule a delivery or pickup window so the experience fits my routine.', 'High', 'Sprint 2'),
    ('6', 'As a QA engineer, I want to run automated regression tests so defects are caught before each release.', 'Medium', 'Sprint 3'),
    ('7', 'As a consumer, I want to re-order past purchases in one tap so repeat buying is seamless.', 'Medium', 'Sprint 3'),
    ('8', 'As a consumer, I want to subscribe to a weekly produce box to reduce decision fatigue.', 'Low', 'Post-MVP'),
    ('9', 'As a producer, I want an AI-driven demand forecast to plan planting and harvests more accurately.', 'Low', 'Post-MVP'),
]

col_widths = [Inches(0.35), Inches(3.8), Inches(0.85), Inches(1.0)]
tbl = doc.add_table(rows=len(backlog_data), cols=4)
tbl.style = 'Table Grid'
tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
for c, w in enumerate(col_widths):
    for row in tbl.rows:
        row.cells[c].width = w

for r_idx, row_data in enumerate(backlog_data):
    row = tbl.rows[r_idx]
    for c_idx, text in enumerate(row_data):
        if r_idx == 0:
            shade_row(row)
            table_header_cell(row.cells[c_idx], text)
        else:
            table_cell(row.cells[c_idx], text)

doc.add_paragraph()  # spacer

# 4.3 Sprint Overview
heading2('4.3  Sprint Overview')

sprint_overview = [
    ('Sprint 1', 'Foundation & Discovery', 'Weeks 1–8',
     ['User research & producer interviews',
      'Sitemap & information architecture',
      'UX wireframes & design system',
      'Producer profile & browse features']),
    ('Sprint 2', 'MVP Development', 'Weeks 9–16',
     ['Product catalogue & cart',
      'Checkout & payment integration',
      'Producer order dashboard',
      'Delivery scheduling module']),
    ('Sprint 3', 'Testing, Optimization & Launch', 'Weeks 17–24',
     ['Beta pilot with real users',
      'Performance & accessibility testing',
      'Bug fixing & UX improvements',
      'App store submission & soft launch']),
]

tbl2 = doc.add_table(rows=1, cols=3)
tbl2.style = 'Table Grid'
tbl2.alignment = WD_TABLE_ALIGNMENT.LEFT
for c in range(3):
    tbl2.columns[c].width = Inches(2.17)

for c_idx, (num, name, weeks, items) in enumerate(sprint_overview):
    cell = tbl2.rows[0].cells[c_idx]
    cell.text = ''
    p1 = cell.paragraphs[0]
    r1 = p1.add_run(num.upper())
    r1.bold = True; r1.font.size = Pt(9); r1.font.name = 'Times New Roman'
    r1.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    p2 = cell.add_paragraph()
    r2 = p2.add_run(name)
    r2.bold = True; r2.font.size = Pt(11); r2.font.name = 'Times New Roman'

    p3 = cell.add_paragraph()
    r3 = p3.add_run(weeks)
    r3.italic = True; r3.font.size = Pt(10); r3.font.name = 'Times New Roman'
    r3.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

    for item in items:
        pi = cell.add_paragraph(style='List Bullet')
        pi.paragraph_format.left_indent = Inches(0.15)
        ri = pi.add_run(item)
        ri.font.size = Pt(10); ri.font.name = 'Times New Roman'

doc.add_paragraph()  # spacer

# Sprint 1 detail
heading3('Sprint 1: Foundation & Discovery (Weeks 1–8)')
body(
    'The first sprint cycle focuses on learning before building. The team will conduct structured '
    'interviews with 20 target consumers and 10 prospective producer partners to validate core '
    'assumptions about the platform. Key technical outputs include the application architecture '
    'decision (React Native for cross-platform mobile, Node.js/PostgreSQL backend), a finalized '
    'sitemap, and interactive wireframes for all MVP screens.'
)
body('User Stories and Acceptance Criteria:', bold=True)
bullet(
    '\u201cAs a consumer, I want to browse local producers by distance.\u201d \u2014 '
    'Acceptance: Consumer can view a list of producers sorted by proximity; geolocation '
    'permission is requested and handled gracefully on both iOS and Android.'
)
bullet(
    '\u201cAs a producer, I want to create a storefront profile.\u201d \u2014 '
    'Acceptance: Producer can register, upload photos, write a bio, and publish their profile; '
    'profile is visible to consumers within 5 minutes of publication.'
)

# Sprint 2 detail
heading3('Sprint 2: MVP Development (Weeks 9–16)')
body(
    'Sprint 2 delivers the transactional core of the platform. The development team will build '
    'the product catalogue, shopping cart, Stripe payment integration, producer order dashboard, '
    'and the delivery scheduling module. Mobile responsiveness and accessibility (WCAG 2.1 AA) '
    'will be tested throughout this cycle, not deferred to Sprint 3.'
)
body('User Stories and Acceptance Criteria:', bold=True)
bullet(
    '\u201cAs a consumer, I want to add products to a cart and check out securely.\u201d \u2014 '
    'Acceptance: Payment succeeds in the test environment with no PCI data stored client-side; '
    'consumer receives an order confirmation email within 60 seconds of checkout.'
)
bullet(
    '\u201cAs a producer, I want to receive and manage incoming orders on a dashboard.\u201d \u2014 '
    'Acceptance: New orders appear on the producer dashboard within 30 seconds; producer can '
    'mark orders as confirmed, in-progress, or fulfilled.'
)
bullet(
    '\u201cAs a consumer, I want to schedule a delivery or pickup window.\u201d \u2014 '
    'Acceptance: Consumer can choose from at least three available time slots; selected slot is '
    'confirmed in the order summary and producer notification.'
)

# Sprint 3 detail
heading3('Sprint 3: Testing, Optimization & Beta Launch (Weeks 17–24)')
body(
    'The final sprint cycle centres on quality assurance, performance optimization, and the '
    'controlled beta launch. A closed cohort of 12 producers and 250\u2013300 consumers will use '
    'the live application for six weeks. Sprint Reviews during this phase will draw directly on '
    'beta feedback, and the backlog will be re-prioritized in real time based on what users '
    'actually do in the product versus what was anticipated.'
)
body('User Stories and Acceptance Criteria:', bold=True)
bullet(
    '\u201cAs a QA engineer, I want to run automated regression tests.\u201d \u2014 '
    'Acceptance: Test suite covers 80% of critical user paths; all tests pass before each '
    'production deployment.'
)
bullet(
    '\u201cAs a consumer, I want to re-order past purchases in one tap.\u201d \u2014 '
    'Acceptance: Re-order button appears in order history; tapping it adds the same items to '
    'cart with a single confirmation step.'
)

# 4.4 Scrum Ceremonies
heading2('4.4  Scrum Ceremonies (Common Across All Sprints)')
body('The following four ceremonies will be observed consistently throughout the project lifecycle:')
bullet('Held at the start of each two-week sprint. The team collaboratively selects backlog items, estimates effort using story points, and agrees on a sprint goal.', 'Sprint Planning')
bullet('A 15-minute stand-up each morning. Each team member addresses: what was completed yesterday, what is planned for today, and whether any impediments exist.', 'Daily Scrum')
bullet('Held at the end of each sprint. Completed work is demonstrated to stakeholders (including pilot producers) for feedback. The product backlog is updated based on the discussion.', 'Sprint Review')
bullet('An internal team meeting to reflect on process improvements\u2014what worked well, what did not, and what the team will change in the next sprint.', 'Sprint Retrospective')

# 4.5 Risk Management table
heading2('4.5  Risk Management')

risk_data = [
    ('Risk', 'Likelihood', 'Impact', 'Mitigation Strategy'),
    ('Provincial food safety regulations vary and may restrict direct producer-to-consumer sales',
     'Medium', 'High',
     'Engage a food-law consultant in Sprint 1; design platform to support compliance flags per province'),
    ('Low producer adoption due to digital literacy barriers',
     'Medium', 'High',
     'Conduct hands-on onboarding workshops; assign a dedicated producer success role for the beta period'),
    ('Logistics complexity (cold chain, last-mile delivery) exceeds MVP scope',
     'High', 'Medium',
     'Partner with an existing local courier in Sprint 2; limit delivery radius to 20 km for MVP'),
    ('Scope creep from stakeholder feature requests',
     'High', 'Medium',
     'Enforce strict sprint scope gates; all new requests enter the backlog and are prioritized in Sprint Review'),
    ('Payment security vulnerabilities',
     'Low', 'High',
     "Use Stripe's fully managed payment infrastructure; conduct third-party security audit before beta launch"),
]

risk_widths = [Inches(2.0), Inches(0.85), Inches(0.7), Inches(2.45)]
tbl3 = doc.add_table(rows=len(risk_data), cols=4)
tbl3.style = 'Table Grid'
tbl3.alignment = WD_TABLE_ALIGNMENT.LEFT
for c, w in enumerate(risk_widths):
    for row in tbl3.rows:
        row.cells[c].width = w

for r_idx, row_data in enumerate(risk_data):
    row = tbl3.rows[r_idx]
    for c_idx, text in enumerate(row_data):
        if r_idx == 0:
            shade_row(row)
            table_header_cell(row.cells[c_idx], text)
        else:
            table_cell(row.cells[c_idx], text)

doc.add_paragraph()

# 4.6 Success Measures
heading2('4.6  Success Measures')
bullet('Successful soft launch of the application on iOS App Store and Google Play by the end of Sprint 3')
bullet('At least 12 active producer storefronts live at the time of beta launch')
bullet('Minimum 200 completed consumer transactions during the six-week beta period')
bullet('Average consumer app rating of 4.0 or higher following beta')
bullet('Producer net promoter score (NPS) of +30 or higher at the end of the beta period')
bullet('System uptime of 99% or greater throughout the beta phase')

# 4.7 Future Enhancements
heading2('4.7  Future Enhancements (Post-MVP Backlog)')
body(
    'The following features are out of scope for the MVP but have been identified as high-value '
    'candidates for future development cycles, pending validation during the beta phase:'
)
bullet('Weekly subscription produce box with personalization based on consumer purchase history')
bullet('AI-driven demand forecasting dashboard for producers to optimize planting cycles')
bullet('B2B ordering module for restaurants, schools, and food co-operatives')

# ════════════════════════════════════════════════════════════════════════════
# REFERENCES
# ════════════════════════════════════════════════════════════════════════════
heading1('References')

refs = [
    'Cohn, M. (2004). User stories applied: For agile software development. Addison-Wesley.',
    'Fowler, M., & Highsmith, J. (2001). The agile manifesto. Software Development, 9(8), 28\u201335.',
    'Ries, E. (2011). The lean startup: How today\u2019s entrepreneurs use continuous innovation to create radically successful businesses. Crown Business.',
    'Schwaber, K., & Sutherland, J. (2020). The Scrum guide: The definitive guide to Scrum \u2014 the rules of the game. Scrum.org. https://scrumguides.org/scrum-guide.html',
    'Statistics Canada. (2023). Food security and local food purchases: 2022 Canadian Community Health Survey supplement. Government of Canada. https://www.statcan.gc.ca',
]

for ref in refs:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.left_indent   = Inches(0.5)
    pf.first_line_indent = Inches(-0.5)
    pf.space_after   = Pt(6)
    run = p.add_run(ref)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)

# ════════════════════════════════════════════════════════════════════════════
# APPENDIX A – DETAILED SPRINT SCHEDULE
# ════════════════════════════════════════════════════════════════════════════
doc.add_page_break()
heading1('Appendix A \u2013 Detailed Sprint Schedule')

appendix_data = [
    ('Sprint Cycle', 'Weeks', 'Sprint Goal', 'Key Deliverables'),
    ('Sprint 1 \u2013 Cycle 1', '1\u20132', 'Complete user research',
     '20 consumer interviews; 10 producer interviews; research synthesis report'),
    ('Sprint 1 \u2013 Cycle 2', '3\u20134', 'Finalize information architecture',
     'Sitemap; navigation taxonomy; content inventory'),
    ('Sprint 1 \u2013 Cycle 3', '5\u20136', 'Deliver wireframes & design system',
     'Low- and mid-fidelity wireframes; typography, colour, and component library'),
    ('Sprint 1 \u2013 Cycle 4', '7\u20138', 'Producer profile feature live in staging',
     'Producer registration flow; profile display page; admin review queue'),
    ('Sprint 2 \u2013 Cycle 1', '9\u201310', 'Product catalogue functional',
     'Category browsing; product detail pages; inventory management for producers'),
    ('Sprint 2 \u2013 Cycle 2', '11\u201312', 'Cart and checkout complete',
     'Cart functionality; Stripe integration; order confirmation emails'),
    ('Sprint 2 \u2013 Cycle 3', '13\u201314', 'Producer dashboard and delivery scheduling',
     'Order management dashboard; delivery slot booking module'),
    ('Sprint 2 \u2013 Cycle 4', '15\u201316', 'Internal UAT and accessibility review',
     'WCAG 2.1 AA audit report; bug fix backlog; consumer account features'),
    ('Sprint 3 \u2013 Cycle 1', '17\u201318', 'Beta cohort onboarded',
     '12 producers live; 250 consumer accounts created; monitoring dashboards active'),
    ('Sprint 3 \u2013 Cycle 2', '19\u201320', 'First beta feedback loop',
     'Sprint Review with beta participants; updated backlog; top 5 UX pain points addressed'),
    ('Sprint 3 \u2013 Cycle 3', '21\u201322', 'Performance and security hardening',
     'Load testing report; third-party security audit; re-order feature shipped'),
    ('Sprint 3 \u2013 Cycle 4', '23\u201324', 'Soft public launch',
     'App store approval; press release; onboarding of 10 additional producers; launch retrospective'),
]

app_widths = [Inches(1.4), Inches(0.55), Inches(1.8), Inches(2.25)]
tbl4 = doc.add_table(rows=len(appendix_data), cols=4)
tbl4.style = 'Table Grid'
tbl4.alignment = WD_TABLE_ALIGNMENT.LEFT
for c, w in enumerate(app_widths):
    for row in tbl4.rows:
        row.cells[c].width = w

for r_idx, row_data in enumerate(appendix_data):
    row = tbl4.rows[r_idx]
    for c_idx, text in enumerate(row_data):
        if r_idx == 0:
            shade_row(row)
            table_header_cell(row.cells[c_idx], text)
        else:
            table_cell(row.cells[c_idx], text, size=10)

# ════════════════════════════════════════════════════════════════════════════
# SAVE
# ════════════════════════════════════════════════════════════════════════════
doc.save('/workspace/agile-project-roadmap.docx')
print('Saved: /workspace/agile-project-roadmap.docx')
