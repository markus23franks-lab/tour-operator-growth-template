"use strict";

/**
 * Growth Operator Intelligence Engine v1
 *
 * Converts raw business signals into one shared intelligence snapshot:
 * profile -> findings -> priorities -> mission -> Growth Score.
 * Future crawlers and integrations should add signals, not rewrite the UI.
 */
class GOIntelligenceEngine {
  constructor(options = {}) {
    this.version = "1.0.0";
    this.now = options.now || (() => new Date());
    this.pillars = ["Visibility", "Trust", "Conversion", "Operations", "Intelligence", "Growth"];
    this.defaultScores = {
      Visibility: 82,
      Trust: 74,
      Conversion: 61,
      Operations: 74,
      Intelligence: 68,
      Growth: 76
    };
    this.templates = this.createFindingTemplates();
  }

  analyze({ assessment = {}, previewScores = {}, previewMission = {}, liveAudit = null } = {}) {
    const scores = this.buildScores(previewScores, liveAudit);
    const findings = this.buildFindings(scores, liveAudit);
    const mission = this.chooseMission(findings, previewMission);
    const growthScore = this.calculateGrowthScore(scores, findings);
    const snapshot = {
      engineVersion: this.version,
      generatedAt: this.now().toISOString(),
      mode: liveAudit ? "live-assisted" : "preview",
      assessment: this.normalizeAssessment(assessment),
      scores,
      growthScore,
      findings,
      mission,
      sourceSummary: this.buildSourceSummary(liveAudit)
    };

    this.persist(snapshot);
    return snapshot;
  }

  normalizeAssessment(assessment) {
    const businessName = this.normalizeBusinessName(assessment.businessName || "Blue River Rafting");
    return {
      businessName,
      ownerName: String(assessment.ownerName || "Markus Franks").trim(),
      website: String(assessment.website || "https://blueriverrafting.com").trim(),
      bookingPlatform: String(assessment.bookingPlatform || "Not connected").trim()
    };
  }

  buildScores(previewScores, liveAudit) {
    const base = { ...this.defaultScores, ...(previewScores || {}) };
    const normalized = Object.fromEntries(
      this.pillars.map((pillar) => [pillar, this.clamp(Number(base[pillar]) || this.defaultScores[pillar], 0, 100)])
    );

    if (!liveAudit?.categories) return normalized;

    const category = liveAudit.categories;
    const performance = this.numberOr(category.performance, normalized.Conversion);
    const seo = this.numberOr(category.seo, normalized.Visibility);
    const accessibility = this.numberOr(category.accessibility, normalized.Trust);
    const bestPractices = this.numberOr(category.bestPractices, normalized.Operations);

    return {
      Visibility: this.weighted(normalized.Visibility, seo, 0.35, 0.65),
      Trust: this.weighted(normalized.Trust, accessibility, 0.45, 0.55),
      Conversion: this.weighted(normalized.Conversion, performance, 0.25, 0.75),
      Operations: this.weighted(normalized.Operations, bestPractices, 0.45, 0.55),
      Intelligence: this.clamp(Math.round(normalized.Intelligence * 0.7 + 21), 0, 100),
      Growth: this.clamp(Math.round((performance + seo + accessibility + bestPractices) / 4), 0, 100)
    };
  }

  buildFindings(scores, liveAudit) {
    const liveFindings = this.normalizeLiveFindings(liveAudit, scores);
    if (liveFindings.length) return this.rankFindings(liveFindings).slice(0, 5);

    const findings = this.pillars.map((pillar) => {
      const score = Number(scores[pillar] || 0);
      const template = this.templates[pillar];
      const status = score >= 78 ? "Strength" : score >= 60 ? "Opportunity" : "Needs attention";
      const impact = this.inferImpact(score, pillar);
      const effort = template.effort;
      const confidence = 68 + Math.round(Math.abs(72 - score) * 0.45);
      return this.createFinding({
        id: pillar.toLowerCase(),
        pillar,
        score,
        status,
        tone: status === "Strength" ? "finding-strength" : status === "Needs attention" ? "finding-alert" : "finding-opportunity",
        impact,
        effort,
        confidence: this.clamp(confidence, 68, 94),
        evidenceType: "Modeled business signal",
        source: "Assessment + six-pillar preview",
        ...template
      });
    });

    return this.rankFindings(findings).slice(0, 5);
  }

  normalizeLiveFindings(liveAudit, scores) {
    if (!Array.isArray(liveAudit?.findings)) return [];

    return liveAudit.findings.map((finding, index) => {
      const pillar = this.pillars.includes(finding.pillar) ? finding.pillar : "Conversion";
      const score = Number.isFinite(finding.score) ? finding.score : scores[pillar];
      const template = this.templates[pillar];
      return this.createFinding({
        id: finding.id || `live-${index + 1}`,
        pillar,
        icon: finding.icon || template.icon,
        title: finding.title || template.title,
        summary: finding.summary || template.summary,
        found: finding.found || template.found,
        why: finding.why || template.why,
        recommendation: finding.recommendation || template.recommendation,
        expected: finding.expected || template.expected,
        verify: finding.evidence || template.verify,
        score,
        status: finding.status || (score >= 78 ? "Strength" : score >= 60 ? "Opportunity" : "Needs attention"),
        tone: finding.tone || (score < 60 ? "finding-alert" : score >= 78 ? "finding-strength" : "finding-opportunity"),
        impact: finding.impact || this.inferImpact(score, pillar),
        effort: finding.effort || template.effort,
        confidence: Number(finding.confidence) || 88,
        evidenceType: "Measured website signal",
        source: "Live mobile website check"
      });
    });
  }

  createFinding(input) {
    const impactWeight = { Low: 1, Medium: 2, High: 3, Critical: 4 }[input.impact] || 2;
    const effortWeight = { Easy: 1, Medium: 2, Hard: 3 }[input.effort] || 2;
    const gap = Math.max(0, 100 - Number(input.score || 0));
    const priorityScore = Math.round((gap * 0.45) + (impactWeight * 16) + (Number(input.confidence || 70) * 0.18) - (effortWeight * 5));

    return {
      ...input,
      priorityScore: this.clamp(priorityScore, 0, 100),
      createdAt: this.now().toISOString()
    };
  }

  rankFindings(findings) {
    return [...findings].sort((a, b) => {
      if (a.status === "Strength" && b.status !== "Strength") return 1;
      if (b.status === "Strength" && a.status !== "Strength") return -1;
      return b.priorityScore - a.priorityScore;
    });
  }

  chooseMission(findings, previewMission) {
    const primary = findings.find((finding) => finding.status !== "Strength") || findings[0];
    const previewMatches = previewMission?.pillar === primary?.pillar;
    return {
      findingId: primary?.id || "conversion",
      pillar: primary?.pillar || previewMission?.pillar || "Conversion",
      title: previewMatches && previewMission.title ? previewMission.title : this.missionTitle(primary?.pillar),
      reason: primary?.why || previewMission?.reason || "This is the clearest modeled path to measurable improvement.",
      confidence: primary?.confidence || Number(previewMission?.confidence) || 88,
      impact: primary?.impact || "High",
      effort: primary?.effort || "Medium",
      expected: primary?.expected || "More direct bookings from existing demand.",
      priorityScore: primary?.priorityScore || 75
    };
  }

  calculateGrowthScore(scores, findings) {
    const scoreAverage = this.pillars.reduce((sum, pillar) => sum + Number(scores[pillar] || 0), 0) / this.pillars.length;
    const evidenceConfidence = findings.length
      ? findings.reduce((sum, finding) => sum + Number(finding.confidence || 0), 0) / findings.length
      : 70;
    return this.clamp(Math.round(scoreAverage * 0.9 + evidenceConfidence * 0.1), 0, 100);
  }

  buildSourceSummary(liveAudit) {
    if (liveAudit) {
      return {
        label: "LIVE-ASSISTED ANALYSIS",
        detail: "Website performance and technical signals combined with the business preview model.",
        sources: ["Assessment", "Website Lighthouse", "Six-pillar model"]
      };
    }
    return {
      label: "PREVIEW ANALYSIS",
      detail: "Assessment inputs interpreted through the six Growth Pillars.",
      sources: ["Assessment", "Six-pillar model"]
    };
  }

  persist(snapshot) {
    try {
      localStorage.setItem("growthOperatorIntelligenceSnapshot", JSON.stringify(snapshot));
    } catch (error) {
      console.warn("Growth Operator could not persist the intelligence snapshot.", error);
    }
  }

  missionTitle(pillar) {
    const titles = {
      Visibility: "Strengthen local discovery",
      Trust: "Turn customer trust into booking confidence",
      Conversion: "Improve mobile booking conversion",
      Operations: "Protect leads with consistent follow-up",
      Intelligence: "Build your competitor benchmark",
      Growth: "Create a focused improvement rhythm"
    };
    return titles[pillar] || titles.Conversion;
  }

  inferImpact(score, pillar) {
    if (["Conversion", "Operations"].includes(pillar) && score < 72) return "High";
    if (score < 55) return "Critical";
    if (score < 72) return "High";
    if (score < 82) return "Medium";
    return "Low";
  }

  createFindingTemplates() {
    return {
      Visibility: {
        icon: "◎",
        effort: "Medium",
        title: "Make it easier for nearby travelers to find you",
        summary: "Your local presence can do more of the work before a traveler ever reaches your website.",
        found: "There is room to strengthen how consistently your business appears across high-intent local searches and discovery channels.",
        why: "Travelers often choose from the first credible options they see. Weak visibility lets competitors win the click before your experience is considered.",
        recommendation: "Tighten local search presence, confirm business information everywhere, and build pages around searches most likely to produce bookings.",
        expected: "More qualified website visits and booking inquiries from travelers already looking for what you offer.",
        verify: "Google Business Profile completeness, local rankings, Search Console queries, directory consistency, and location-page coverage."
      },
      Trust: {
        icon: "★",
        effort: "Easy",
        title: "Use customer trust more deliberately",
        summary: "Your reputation should reduce hesitation at every important booking decision.",
        found: "Customer trust appears to be an important asset, but it may not be visible enough throughout the customer journey.",
        why: "Travelers compare unfamiliar operators quickly. Reviews, photos, policies, and proof help them feel safe choosing you.",
        recommendation: "Place strong reviews and clear trust signals near pricing, availability, booking buttons, and checkout decisions.",
        expected: "Higher booking confidence and stronger conversion without needing additional traffic.",
        verify: "Google and Tripadvisor rating trends, review volume, response rate, testimonial placement, photo quality, and policy clarity."
      },
      Conversion: {
        icon: "➤",
        effort: "Medium",
        title: "Remove friction from the booking journey",
        summary: "Interested visitors should never have to work hard to become paying customers.",
        found: "Calls to action, mobile usability, or unnecessary decisions may be allowing high-intent visitors to leave.",
        why: "More marketing cannot solve a conversion problem. Every unclear step between interest and checkout creates another chance to lose revenue.",
        recommendation: "Keep the booking action visible, simplify the path to availability, and answer the most important questions before checkout.",
        expected: "More direct bookings from the traffic and demand you already have.",
        verify: "Mobile CTA visibility, booking-engine steps, page speed, abandonment data, form friction, analytics funnels, and checkout completion."
      },
      Operations: {
        icon: "⚙",
        effort: "Medium",
        title: "Protect leads with consistent follow-up",
        summary: "Demand becomes revenue only when calls, inquiries, confirmations, and staff handoffs are handled reliably.",
        found: "The business may be relying on people to remember important follow-up steps that should happen automatically.",
        why: "Missed calls, slow responses, manual calendars, and inconsistent guest communication create revenue leakage and staff work.",
        recommendation: "Centralize inquiries, automate confirmations and reminders, and create a visible owner for every follow-up task.",
        expected: "More inquiries converted, fewer dropped opportunities, and less manual work for the team.",
        verify: "Call-answer rate, inquiry response time, confirmation delivery, waiver completion, calendar ownership, CRM capture, and cancellation workflows."
      },
      Intelligence: {
        icon: "✦",
        effort: "Medium",
        title: "Turn market information into better decisions",
        summary: "Competitor, pricing, traffic, and customer signals should guide what you do next.",
        found: "Useful market knowledge likely exists, but it is not organized into a reliable benchmark the business can monitor.",
        why: "Without a comparison point, operators can react to noise, miss competitor changes, or invest in the wrong improvement.",
        recommendation: "Establish a small competitor set and monitor pricing, reviews, visibility, offers, and positioning on a repeatable schedule.",
        expected: "Faster, more confident decisions about pricing, marketing, positioning, and investment.",
        verify: "Competitor pricing, review velocity, search position, offer changes, ad activity, social presence, and product mix."
      },
      Growth: {
        icon: "↗",
        effort: "Easy",
        title: "Create one repeatable improvement rhythm",
        summary: "The business needs a clear way to choose, complete, and measure the next improvement.",
        found: "There are several credible ways to grow, but pursuing too many at once dilutes attention and makes results hard to measure.",
        why: "A focused improvement cycle creates accountability and makes it easier to see what actually changed the business.",
        recommendation: "Work one prioritized mission at a time, define the expected outcome, and measure the result before choosing the next move.",
        expected: "More consistent progress, clearer ROI, and fewer unfinished initiatives.",
        verify: "Mission completion, baseline metrics, outcome tracking, revenue impact, owner accountability, and time-to-result."
      }
    };
  }

  weighted(first, second, firstWeight, secondWeight) {
    return this.clamp(Math.round(first * firstWeight + second * secondWeight), 0, 100);
  }

  numberOr(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  normalizeBusinessName(value) {
    const cleaned = String(value || "").trim();
    return cleaned.toLowerCase() === "growth operator" ? "Growth Operator" : cleaned;
  }
}

window.GOIntelligenceEngine = GOIntelligenceEngine;