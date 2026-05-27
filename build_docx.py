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

# Horizontal rule
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
    'The idea for UrbanRoots started with a pretty straightforward observation: I live in a city '
    'that has dozens of small farms within 40 kilometres, yet the tomatoes in my grocery store '
    'were grown in Mexico. That gap \u2014 between what\u2019s available locally and what '
    'actually ends up on people\u2019s plates \u2014 is what this project is trying to close.'
)
body(
    'UrbanRoots is a mobile-first digital marketplace that connects local farmers, small food '
    'producers, and urban growers directly with city consumers. The core problem it addresses is '
    'one a lot of people would recognize: even if you want to buy locally grown food, it\u2019s '
    'genuinely inconvenient to do it. Farmers\u2019 markets run for a few hours on Saturday '
    'mornings. CSA box programmes ask for six-month commitments that many households aren\u2019t '
    'ready to make. And most of the grocery delivery apps that launched over the past few years '
    'are just digital storefronts for the same national distributors.'
)
body(
    'The platform is designed as a two-sided marketplace. On one side, local producers get a '
    'simple digital storefront and basic order management tools \u2014 nothing complicated, just '
    'enough for them to list what\u2019s available and manage incoming orders without needing a '
    'tech background. On the consumer side, people get a browsable app where they can find farms '
    'near them, see what\u2019s in season, and schedule a delivery or pickup that actually fits '
    'their week. The initial pilot will run in one mid-sized Canadian city, most likely Ottawa or '
    'Hamilton, before the team reassesses whether and how to expand.'
)
body(
    'It\u2019s worth being upfront about something: the final version of this product is not '
    'fully figured out yet. We don\u2019t know whether consumers will prefer subscriptions or '
    'one-off orders, whether producers want to handle their own delivery or share a logistics '
    'partner, or even exactly which features matter most to either group. That uncertainty is '
    'precisely why Agile is the right framework here. The roadmap that follows is a starting '
    'point, not a finished blueprint.'
)

h2('Problem / Opportunity Statement')
body(
    'Most urban Canadians say they want to buy more local food \u2014 surveys consistently show '
    'this \u2014 but they don\u2019t actually do it, mostly because the option isn\u2019t '
    'convenient enough to become a regular habit (Statistics Canada, 2023). At the same time, '
    'small-scale producers are spending significant time and energy on logistics, marketing, and '
    'customer communication that they didn\u2019t sign up for when they decided to farm. '
    'UrbanRoots is an attempt to fix both sides of that problem at once, by building '
    'infrastructure that makes buying local food as easy as ordering from any grocery app, while '
    'making sure the money flows back to the people growing it.'
)


# ════════════════════════════════════════════════════════════════════════════
# 2. VISION STATEMENT
# ════════════════════════════════════════════════════════════════════════════
h1('2. Vision Statement')

body(
    '\u201cA Canada where buying food from a farm 20 kilometres away is just as easy, reliable, '
    'and affordable as buying from a national grocery chain \u2014 and where the farmer '
    'actually earns a fair return for growing it.\u201d',
    italic=True
)
body(
    'The long-term ambition for UrbanRoots isn\u2019t just to build another marketplace app. '
    'It\u2019s to meaningfully shift how urban food systems work. If this succeeds, local '
    'producers will have a revenue channel they can genuinely plan around, not just a side '
    'income from weekend markets. Consumers will trust the platform enough that buying local '
    'becomes a default routine rather than something they do occasionally when it\u2019s '
    'convenient.'
)
body(
    'Success won\u2019t just be measured in transactions or app downloads. The metrics that '
    'actually matter are whether farmers are earning more, whether food waste in the local '
    'supply chain is going down, and whether the communities this platform serves feel a '
    'genuine connection to where their food comes from. That\u2019s the goal. The app '
    'is just the vehicle.'
)


# ════════════════════════════════════════════════════════════════════════════
# 3. MVP
# ════════════════════════════════════════════════════════════════════════════
h1('3. Minimum Viable Product (MVP)')

body(
    'Before building anything large or complicated, the most important question to answer is a '
    'simple one: will people actually use this? The MVP is designed around that question. It\u2019s '
    'a lean but fully functional version of the platform \u2014 enough to run a real six-week '
    'beta with actual producers and actual consumers, and to learn something meaningful from '
    'how they use it.'
)
body(
    'The plan is to recruit 12 to 15 local producers and around 250 to 300 consumers in one '
    'city for the beta period. That\u2019s not a huge number, but it\u2019s enough to see real '
    'behaviour rather than survey responses. The features below represent what is needed to '
    'make that beta genuinely useful \u2014 not a prototype people test once and forget, but '
    'something they could realistically use to buy groceries on a regular basis.'
)

h2('MVP Features')
bul('Producers can build a simple profile \u2014 a short bio, a few photos, and a note about '
    'how they grow or make their products. Nothing elaborate; just enough for a consumer to '
    'know who they\u2019re buying from.', 'Producer profiles')
bul('A product listing where producers set prices, quantities, and availability windows. '
    'Consumers browse by category (vegetables, dairy, baked goods, etc.) or by proximity '
    'to their location.', 'Product catalogue')
bul('Add to cart, choose a delivery or pickup slot, and pay via Stripe. The checkout flow '
    'needs to be smooth enough that someone could complete it in under two minutes on a phone.',
    'Order and checkout')
bul('A basic tool letting producers \u2014 or a partner courier \u2014 confirm and track '
    'deliveries within a defined radius. For the MVP, that radius stays at 20 km to keep '
    'logistics manageable.', 'Delivery scheduling')
bul('Registered consumers can see their order history and re-order past purchases without '
    'starting from scratch. A small feature, but one that matters for building a habit.',
    'Consumer account and order history')
bul('A simple backend view where producers can see incoming orders, mark them as fulfilled, '
    'and track basic sales numbers. It doesn\u2019t need to be sophisticated \u2014 it just '
    'needs to replace the spreadsheet most of them are using now.', 'Producer order dashboard')

body(
    'The MVP is not trying to solve every problem in local food distribution. Subscriptions, '
    'AI-driven recommendations, community features \u2014 all of that can come later, informed '
    'by what the beta cohort actually wants. The point of the MVP phase is to find out what '
    'matters before committing to building it.'
)


# ════════════════════════════════════════════════════════════════════════════
# 4. ROADMAP
# ════════════════════════════════════════════════════════════════════════════
h1('4. Roadmap')

h2('4.1  Agile Framework and Team Structure')
body(
    'The project will use the Scrum framework. That choice is fairly straightforward given '
    'where this project stands: the final product isn\u2019t fully defined, the market '
    'behaviour isn\u2019t fully predictable, and the team needs to be able to change '
    'direction quickly when real user data contradicts the assumptions made at the start '
    '(Schwaber & Sutherland, 2020). A traditional waterfall approach would require '
    'committing upfront to decisions that simply cannot be made responsibly at this stage.'
)
body('The Scrum team will include the following roles:')
bul('Owns and maintains the product backlog, and makes prioritization calls when there\u2019s '
    'a conflict between what stakeholders want and what the team can realistically deliver '
    'in a sprint.', 'Product Owner')
bul('Runs all Scrum ceremonies, helps the team unblock themselves, and keeps the process '
    'honest \u2014 calling out when scope is creeping or when a sprint goal has quietly shifted.',
    'Scrum Master')
bul('Two front-end developers, one back-end developer, one UX/UI designer, and one QA '
    'engineer. Cross-functional enough that no sprint should stall waiting on a single person.',
    'Development Team')
bul('Pilot producers, early-adopter consumers, and a logistics partner representative who '
    'attend Sprint Reviews and whose feedback directly shapes the backlog.', 'Stakeholders')

h2('4.2  Product Backlog')
body(
    'The table below lists the features identified at the start of the project, ordered by '
    'priority. This isn\u2019t a fixed list \u2014 it will be updated after every Sprint '
    'Review as the team learns more. Items marked Post-MVP are genuine priorities; '
    'they\u2019re simply deferred until the core platform has been validated.'
)
make_table(
    data=[
        ('#', 'User Story', 'Priority', 'Sprint Target'),
        ('1', 'As a consumer, I want to browse local producers by distance so I can find farms near me.', 'High', 'Sprint 1'),
        ('2', 'As a producer, I want to create a storefront profile so consumers can learn about my farm.', 'High', 'Sprint 1'),
        ('3', 'As a consumer, I want to add products to a cart and check out securely.', 'High', 'Sprint 2'),
        ('4', 'As a producer, I want to see and manage my incoming orders on a dashboard so I can fulfil them without confusion.', 'High', 'Sprint 2'),
        ('5', 'As a consumer, I want to pick a delivery or pickup window that fits my schedule.', 'High', 'Sprint 2'),
        ('6', 'As a QA engineer, I want automated regression tests on every build so bugs don\u2019t reach production.', 'Medium', 'Sprint 3'),
        ('7', 'As a consumer, I want to re-order my last purchase in one tap so I don\u2019t start over each week.', 'Medium', 'Sprint 3'),
        ('8', 'As a consumer, I want a weekly produce subscription to reduce decision fatigue.', 'Low', 'Post-MVP'),
        ('9', 'As a producer, I want a demand forecast tool to plan planting without overproducing.', 'Low', 'Post-MVP'),
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

# Sprint 1
h3('Sprint 1: Foundation & Discovery (Weeks 1\u20138)')
body('This sprint is about figuring things out before writing a single line of production code. '
     'The team will sit down with 20 target consumers and 10 potential producer partners for '
     'structured interviews \u2014 not to validate assumptions already made, but to test whether '
     'those assumptions are even close to right. Everything from the navigation structure to the '
     'checkout flow should be shaped by those conversations, not decided in a meeting room.')
body('By the end of Sprint 1, the team will have settled on the technical architecture (React '
     'Native for mobile, Node.js and PostgreSQL on the backend), finalized the sitemap, and '
     'shipped the producer profile feature into staging for internal review.')
body('User Stories and Acceptance Criteria:', bold=True)
bul('\u201cAs a consumer, I want to browse local producers by distance.\u201d \u2014 Done when: '
    'the consumer opens the app, grants location access, and sees producers sorted by proximity. '
    'Geolocation prompts must work without errors on both iOS and Android.')
bul('\u201cAs a producer, I want to create a storefront profile.\u201d \u2014 Done when: a '
    'producer can sign up, upload photos, write a bio, and publish their profile. It must be '
    'visible to consumers within five minutes. No admin approval bottleneck.')

# Sprint 2
h3('Sprint 2: MVP Development (Weeks 9\u201316)')
body('Sprint 2 is where the platform starts to feel real. The team builds the product catalogue, '
     'shopping cart, Stripe payment integration, producer order dashboard, and delivery scheduling '
     'module. That\u2019s a substantial workload for eight weeks, which is exactly why the backlog '
     'was kept tight and the team is cross-functional. Accessibility testing to WCAG 2.1 AA '
     'standard happens throughout this sprint, not as an afterthought at the end.')
body('User Stories and Acceptance Criteria:', bold=True)
bul('\u201cAs a consumer, I want to add products to a cart and check out securely.\u201d \u2014 '
    'Done when: checkout completes in the Stripe test environment, no card data is stored on our '
    'servers, and the consumer receives a confirmation email within 60 seconds. That last detail '
    'matters \u2014 it\u2019s what builds trust on a first purchase.')
bul('\u201cAs a producer, I want to see and manage my incoming orders on a dashboard.\u201d \u2014 '
    'Done when: new orders appear on the producer dashboard within 30 seconds of being placed. '
    'Producer can mark each order as confirmed, in progress, or fulfilled.')
bul('\u201cAs a consumer, I want to pick a delivery or pickup window.\u201d \u2014 Done when: at '
    'least three available time slots appear during checkout, and the selected slot shows '
    'correctly in both the order summary and the producer notification.')

# Sprint 3
h3('Sprint 3: Testing, Optimization & Beta Launch (Weeks 17\u201324)')
body('The final sprint is the most important one, and also the most unpredictable. Once real '
     'users start using the live app, things will break and surprises will come up \u2014 that\u2019s '
     'not a pessimistic prediction, it\u2019s just how beta launches go. The sprint is structured '
     'to leave enough buffer to respond to what the beta cohort tells us without derailing the '
     'timeline. Sprint Reviews in this phase pull directly from user feedback, and the backlog '
     'gets re-prioritized accordingly after each one.')
body('User Stories and Acceptance Criteria:', bold=True)
bul('\u201cAs a QA engineer, I want automated regression tests on every build.\u201d \u2014 Done '
    'when: the test suite covers at least 80% of critical user paths and all tests pass before '
    'any production deployment. Non-negotiable heading into a public launch.')
bul('\u201cAs a consumer, I want to re-order my last purchase in one tap.\u201d \u2014 Done when: '
    'the re-order button appears in order history, tapping it adds the same items to cart, and a '
    'single confirmation step completes the order. No more than two taps from history to checkout.')

h2('4.4  Scrum Ceremonies (Consistent Across All Sprints)')
body('These four ceremonies run throughout the project. They\u2019re not optional and not just '
     'formalities \u2014 each one serves a specific purpose in keeping the team aligned and the '
     'product on track.')
bul('At the start of every two-week sprint, the team selects items from the backlog, estimates '
    'effort in story points, and agrees on a sprint goal everyone can point to.', 'Sprint Planning')
bul('A 15-minute stand-up each morning. Three questions: what did you finish yesterday, '
    'what\u2019s on your plate today, and is anything blocking you? Short and honest.', 'Daily Scrum')
bul('At the end of each sprint, the team demonstrates completed work to stakeholders, including '
    'pilot producers. Feedback from these reviews goes straight into the backlog.', 'Sprint Review')
bul('An honest internal conversation about process \u2014 what worked, what didn\u2019t, and one '
    'or two concrete things to change in the next sprint.', 'Sprint Retrospective')

h2('4.5  Risk Management')
body('A few risks are significant enough to plan around explicitly. These aren\u2019t hypothetical '
     'scenarios \u2014 they came up in early conversations with potential producer partners and a '
     'food-law advisor.')
make_table(
    data=[
        ('Risk', 'Likelihood', 'Impact', 'Mitigation'),
        ('Provincial food safety laws vary and could restrict direct producer-to-consumer sales in some markets',
         'Medium', 'High',
         'Engage a food-law consultant in Sprint 1. Build province-specific compliance flags into the platform from day one.'),
        ('Producers may struggle to adopt the platform if the technology feels unfamiliar',
         'Medium', 'High',
         'Run hands-on onboarding workshops before beta launch. Assign a dedicated producer success contact for the first six weeks.'),
        ('Last-mile delivery logistics (cold chain, timing) may be harder than expected',
         'High', 'Medium',
         'Partner with an existing local courier. Keep the delivery zone under 20 km for the MVP and expand only after the model is proven.'),
        ('Scope creep from stakeholder feature requests mid-sprint',
         'High', 'Medium',
         'All new requests go into the backlog. Nothing gets added to a sprint in progress. The Product Owner makes all prioritization calls.'),
        ('Payment security gaps could expose consumer financial data',
         'Low', 'High',
         "Use Stripe's fully managed infrastructure \u2014 we never handle raw card data. Run a third-party security audit before beta launch."),
    ],
    col_widths=[Inches(2.0), Inches(0.78), Inches(0.67), Inches(2.55)],
)

h2('4.6  How We\u2019ll Know It\u2019s Working')
body('Success metrics for the MVP phase are deliberately conservative. The goal at this stage '
     'isn\u2019t impressive headline numbers \u2014 it\u2019s finding out whether the core '
     'experience actually works before building further on top of it.')
bul('App live on iOS App Store and Google Play by end of Sprint 3, with no critical open bugs')
bul('At least 12 active producer storefronts at beta launch')
bul('At least 200 completed consumer transactions during the six-week beta period')
bul('Consumer app rating averaging 4.0 or higher post-beta')
bul('Producer NPS of +30 or higher \u2014 meaning producers would recommend it to other farmers')
bul('System uptime at 99% or above throughout the beta \u2014 reliability matters more than features at this stage')

h2('4.7  What Comes After the MVP')
body('These features are not on the roadmap yet. They\u2019re real priorities, but only worth '
     'building once the beta has confirmed the foundation works.')
bul('Weekly subscription produce boxes, personalized based on what the consumer typically buys')
bul('A demand forecasting tool for producers to plan planting without over- or underproducing')
bul('A B2B channel for restaurants, school cafeterias, and food co-operatives sourcing locally at volume')


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
