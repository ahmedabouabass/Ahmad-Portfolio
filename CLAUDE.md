# CLAUDE.md — Ahmad's Professional Portfolio Website

This file gives Claude (the AI assistant) standing instructions for this project.
Claude reads it automatically at the start of every session, so these rules
apply every time — you don't need to repeat them.

---

## 1. About the owner

Ahmad is a **beginner developer**, and this is their first project.

- Guide Ahmad **step by step**.
- Explain what you are doing in **simple, plain language**. Avoid jargon, or
  explain it briefly when you have to use it.
- Before a large change, give a short summary of the plan.
- After each change, explain what changed and why.

---

## 2. Project goal

Build a **modern, professional, responsive personal portfolio website** for
Ahmad, an educator.

**Main audience: international school recruiters.** They usually scan a page
quickly, so the site should show Ahmad's qualifications, experience and
teaching strengths clearly, and make the CV and contact details easy to find.

The site should be:

- **Elegant, minimal, and polished**: plenty of white space, clear typography,
  no clutter.
- **Professional in colour**: a calm, restrained palette (for example a deep
  navy or slate as the main colour, a soft neutral background, and one warm
  accent colour used sparingly). Keep text easy to read with strong contrast.
- **Responsive**: works well on desktop, tablet, and mobile.
- **Accessible**: semantic HTML, alt text on images, keyboard-friendly
  navigation, and readable font sizes.

---

## 3. Ahmad's background (content for the site)

### Confirmed facts

- Full name: **Ahmad Abou Abass** (use this as the displayed name)
- Title on CV: **Primary Educator | EAL Specialist**
- Over ten years of classroom experience in **Riyadh, Saudi Arabia**, across
  the **Cambridge, British, IB (PYP/MYP) and American** curricula
- Experience teaching **EAL learners** (English as an Additional Language)
- Source of these facts: Ahmad's CV (`cv/Ahmad-CV.pdf`), confirmed by Ahmad

**Employment** (newest first):

- Grade 4 Homeroom Teacher, Riyadh Schools Football Academy, Riyadh, KSA
  (Aug 2024 – Jul 2026)
- Key Stage 2 Teacher, Reigate Grammar School Riyadh, Riyadh, KSA
  (Aug 2023 – Aug 2024)
- Homeroom Teacher (Grades 4 & 5), King Faisal School, Riyadh, KSA
  (Aug 2020 – Jul 2023)
- English & Social Studies Teacher, Khaled International School, Riyadh, KSA
  (Aug 2015 – May 2020)

**Education and qualifications:**

- **MSc Psychology of Mental Health and Wellbeing**, University of
  Wolverhampton (in progress, 2026 – 2028)
- **Teaching Diploma** (RQF Level 6), American University of Science and
  Technology (Oct 2020 – Jun 2021)
- **BA in TESL** (RQF Level 6), Lebanese International University (LIU)
  (Aug 2012 – May 2015)
- **Training of Trainers** certificate, University of London (no year given)

**Contact (approved to show publicly):**

- Email: ahmed.abouabass@gmail.com
- LinkedIn: linkedin.com/in/ahmad-abou-abass

**Ahmad's decisions about what to leave off the website:**

- Phone number (keep it in the CV only)
- The note about the school switching to the Arabic curriculum
- Freshman Year at Northwest College, Wyoming

### Rules for content

Use this information for the site's text. **Never invent** employment dates,
school or employer names, universities, qualifications, achievements, or
contact information. If something is missing, **ask Ahmad** rather than
guessing.

### Placeholders

Until Ahmad provides missing information, use a clearly marked placeholder
in this exact format, so placeholders are easy to find and replace later:

```
[PLACEHOLDER: description of what goes here]
```

Examples: `[PLACEHOLDER: School name]`, `[PLACEHOLDER: Start year – End year]`,
`[PLACEHOLDER: Email address]`, `[PLACEHOLDER: LinkedIn URL]`.

Information still needed from Ahmad:

- A professional photo (optional)
- A preferred tagline (Claude may suggest options for Ahmad to choose from)

---

## 4. Approved website structure

Ahmad approved this structure. It is a **single page** with these **eight
sections**, in this order. Don't add, remove, rename, or reorder sections
without asking Ahmad.

1. **Header / Navigation bar**
   - Ahmad's name on the left, links to each section on the right.
   - On mobile, the links collapse into a "☰" menu button.

2. **Hero**
   - Ahmad's name (large).
   - A one-line professional title, e.g. "Educator · Cambridge Curriculum ·
     EAL Specialist".
   - A short tagline: `[PLACEHOLDER: Tagline]`.
   - A **prominent "Download CV" button**. This is the main call to action and
     should be the most visible button in the Hero. It links to the CV PDF
     (`[PLACEHOLDER: CV file]`).
   - Secondary buttons: "Get in touch" and "View my experience".
   - Optional professional photo: `[PLACEHOLDER: Photo]`.

3. **About Me**
   - Two or three short paragraphs: who Ahmad is as a teacher, what drives
     them, and how the Psychology and Wellbeing studies connect to teaching.

4. **Experience**
   - A simple timeline of roles (e.g. Homeroom Teacher).
   - Each role has 2–3 bullet points (e.g. Cambridge curriculum delivery,
     supporting EAL learners).
   - School names and dates are placeholders until Ahmad provides them.

5. **Education & Qualifications**
   - One card per qualification:
     - Bachelor's degree in TESL
     - Teaching Diploma
     - Training of Trainers certificate, University of London
     - Master's in Psychology and Wellbeing (marked **"In progress"**)
   - Institutions and years are placeholders until provided.

6. **Teaching Philosophy & Core Competencies**
   - A short statement of teaching philosophy.
   - 3–4 highlighted competencies with an icon and one sentence each, e.g.
     EAL support, learner wellbeing, Cambridge curriculum, teacher training.

7. **Contact**
   - Email and LinkedIn links (placeholders until provided).
   - A secondary "Download CV" link.
   - Use simple links rather than a contact form. A form needs an extra
     service to actually send messages; links are simpler and more reliable.

8. **Footer**
   - Ahmad's name, the current year, and repeated contact links.

**Possible future extras** (only if Ahmad asks): Testimonials (only with the
person's permission), Resources / Projects.

---

## 5. Technology

- Start with plain **HTML, CSS, and JavaScript** only. No frameworks
  (React, Vue, etc.), build tools, or package installs unless Ahmad agrees.
- JavaScript should be minimal and only used where it adds real value
  (for example, a mobile menu toggle).
- **Explain important technical decisions** in simple terms, such as why
  a particular layout method (Flexbox or Grid) was chosen.

### File structure

```
Ahmad-Portfolio/
├── CLAUDE.md        ← this file
├── index.html       ← the page content and structure
├── styles.css       ← all the visual styling
├── script.js        ← small interactive features
├── cv/
│   └── README.txt   ← instructions; the CV goes here as Ahmad-CV.pdf
└── images/          ← photos and icons (create when the first image is added)
```

### How the site is set up

- **One place for contact details and the CV:** the `SITE_SETTINGS` object
  at the top of `script.js` holds `cvAvailable`, `cvPath`, `email` and
  `linkedinUrl`. Update these rather than editing links in `index.html`.
- **Until details are added,** the CV, Email and LinkedIn links show a polite
  "coming soon" message instead of a broken link.
- **Colours and fonts** are CSS variables at the top of `styles.css`.

### Previewing and testing

- Ahmad previews the site by double-clicking `index.html`.
- Claude's built-in browser pane can't load `styles.css` and `script.js`
  from a `file://` page. To test there, start a temporary local web server
  (Node.js and Python are not installed, so use PowerShell's
  `System.Net.HttpListener`) and open `http://localhost:<port>/`.

---

## 6. Code style (keep it beginner-friendly)

- Keep code **organised and easy to read**: consistent indentation and clear
  names (e.g. `.hero-section`, not `.hs1`).
- Add **short comments** that explain what each section does.
- Define colours and fonts once in CSS variables (`:root { --color-primary: ... }`)
  so they are easy to change later.
- Design for mobile first, then add layout rules for larger screens.
- Prefer simple, readable solutions over clever ones.

---

## 7. Safety rules (very important)

- **Never delete or overwrite any file without asking Ahmad first.**
  Say which file and why, then wait for a clear "yes".
- Don't install software, add dependencies, or publish anything online
  without asking first.
- Only do what was asked. For example: if Ahmad says "only create X",
  don't build Y as well.

---

## 8. Testing and honesty

- **Run appropriate checks** after making changes. For example:
  - Open the page in a browser and look at it.
  - Check the layout at mobile, tablet, and desktop widths.
  - Look for errors in the browser console.
  - Make sure links work and the HTML is valid.
- **Explain the results** of each check in plain language: what passed,
  what failed, and what it means.
- **Never claim something works unless you have actually tested it.**
  If something wasn't tested, say so clearly.
