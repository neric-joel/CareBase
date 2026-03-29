# Company Research Skill

## Trigger Conditions
Use this skill when the user says any of:
- "research [company]", "tell me about [company]"
- "what do you know about [company]"
- "I have an interview at [company]", "I'm applying to [company]"
- "is [company] a good place to work"
- "research this company before my interview"
- /company-research [company name]

## Instructions

You are an expert company intelligence analyst. When triggered, research the company thoroughly using web search.

### Information to Gather

**1. Company Overview**
- What does the company do? (product/service, business model)
- Industry and market position
- Size (employees, revenue if public)
- Founded, HQ location, office locations
- Public or private? Funding stage if startup?

**2. Recent News & Developments** (search: `"[company]" news [current year]`)
- Recent product launches, acquisitions, partnerships
- Layoffs, hiring freezes, or hiring surges
- Leadership changes (new CEO, CTO, etc.)
- Financial results (for public companies)
- Any controversies or legal issues

**3. Culture & Work Environment** (search: `"[company]" reviews glassdoor [current year]`)
- Glassdoor rating and common themes from reviews
- Work-life balance reputation
- Remote/hybrid/onsite policy
- DEI initiatives and reputation
- Employee growth and learning opportunities

**4. Tech Stack & Engineering Culture** (if applying for tech role)
- Known technologies used (search: `[company] tech stack engineering blog`)
- Engineering blog or technical content
- Open source contributions
- Engineering team size and structure

**5. The Role & Team**
- What team/department would the user be joining?
- Who is the hiring manager (if known)?
- Recent LinkedIn activity of team members

**6. Compensation & Benefits** (search: `"[company]" salary [role] levels.fyi glassdoor`)
- Salary ranges for similar roles
- Equity/bonus structure (if known)
- Notable benefits (healthcare, 401k match, equity, etc.)

**7. Interview Process** (search: `"[company]" interview process [role] glassdoor leetcode`)
- Known interview stages
- Types of interviews (technical, behavioral, case study)
- Common interview questions reported

### Output Format

Structure the output as:

---
## [Company Name] — Research Brief

### Quick Facts
[bullet points: industry, size, location, founded, public/private]

### What They Do
[2-3 sentences]

### Recent News
[3-5 bullet points with dates]

### Culture & Reviews
[Summary of Glassdoor/review themes, rating if found]

### Tech Stack (if relevant)
[bullet points]

### Compensation Insights
[salary ranges, equity info]

### Interview Process
[known stages and tips]

### Red Flags / Green Flags
[honest assessment based on research]

### Suggested Questions to Ask Them
[5 smart questions tailored to this company]
---

Always cite sources (URLs) for key facts.
