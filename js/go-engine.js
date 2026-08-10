"use strict";

(function () {
  const STORAGE_KEY = "growthOperatorBusinessMemory";

  class GOWorkEngine {
    constructor(profile) {
      this.profile = profile;
      this.memory = this.loadMemory();
      this.state = this.buildState();
      this.persist();
    }

    buildState() {
      const lowestPillar = Object.entries(this.profile.scores || {})
        .sort((a, b) => Number(a[1]) - Number(b[1]))[0]?.[0] || "Conversion";
      const opportunity = Math.max(0, Number(this.profile.revenueOpportunity || 0));
      const completed = this.memory.completed || [];
      const approvals = this.memory.approvals || [];
      const journal = this.memory.journal?.length ? this.memory.journal : this.defaultJournal(lowestPillar);

      return {
        business: {
          name: this.profile.businessName,
          owner: this.profile.ownerName,
          website: this.profile.website,
          bookingPlatform: this.profile.bookingPlatform,
          startedAt: this.memory.startedAt || new Date().toISOString()
        },
        headline: this.getHeadline(),
        completed,
        approvals: approvals.length ? approvals : this.defaultApprovals(lowestPillar),
        monitoring: this.defaultMonitoring(),
        working: this.defaultWorking(lowestPillar),
        journal,
        revenueModel: this.buildRevenueModel(opportunity),
        history: this.buildHistory(completed),
        updatedAt: new Date().toISOString()
      };
    }

    getHeadline() {
      const hour = new Date().getHours();
      if (hour < 12) return "Here’s what GO handled before your day started.";
      if (hour < 18) return "Here’s what GO is moving forward today.";
      return "Here’s what GO worked on while you ran the business.";
    }

    defaultApprovals(lowestPillar) {
      const copy = {
        Visibility: ["Local profile cleanup", "I prepared a consistency check for your hours, categories, and business details."],
        Trust: ["Trust signal placement", "I prepared stronger review and proof placement near the booking decision."],
        Conversion: ["Mobile booking improvement", "I prepared a clearer mobile booking path with a persistent booking action."],
        Operations: ["Lead follow-up workflow", "I prepared a faster response and confirmation workflow for high-intent inquiries."],
        Intelligence: ["Competitor benchmark", "I prepared a focused benchmark for pricing, reviews, and market positioning."],
        Growth: ["Weekly improvement plan", "I prepared a one-priority operating rhythm with a measurable outcome."]
      };
      const selected = copy[lowestPillar] || copy.Conversion;
      return [{ id: "approval-1", title: selected[0], detail: selected[1], status: "Ready for approval", pillar: lowestPillar }];
    }

    defaultMonitoring() {
      return [
        { id: "monitor-visibility", label: "Local visibility", detail: "Watching ranking and business-profile changes", state: "Monitoring" },
        { id: "monitor-reviews", label: "Customer trust", detail: "Watching review velocity and rating movement", state: "Monitoring" },
        { id: "monitor-competitors", label: "Competitors", detail: "Watching offers, reviews, and positioning changes", state: "Monitoring" }
      ];
    }

    defaultWorking(lowestPillar) {
      return [
        { id: "work-1", label: `Preparing your ${lowestPillar.toLowerCase()} improvement`, progress: 78 },
        { id: "work-2", label: "Rechecking the highest-priority finding", progress: 52 },
        { id: "work-3", label: "Building the next measurable baseline", progress: 31 }
      ];
    }

    defaultJournal(lowestPillar) {
      const now = new Date();
      const stamp = (minutesAgo) => new Date(now.getTime() - minutesAgo * 60000).toISOString();
      const business = this.profile.businessName || "your business";
      return [
        {
          id: "journal-prepared",
          occurredAt: stamp(42),
          type: "prepared",
          label: "Prepared your next improvement",
          detail: `GO turned the highest-priority ${lowestPillar.toLowerCase()} finding into work that is ready for your approval.`,
          state: "Needs approval"
        },
        {
          id: "journal-competitors",
          occurredAt: stamp(126),
          type: "checked",
          label: "Checked competitor movement",
          detail: `GO reviewed the competitive signals being tracked for ${business}. No urgent response is needed right now.`,
          state: "No action needed"
        },
        {
          id: "journal-reviews",
          occurredAt: stamp(238),
          type: "monitoring",
          label: "Rechecked customer trust signals",
          detail: "GO reviewed rating and review momentum and kept the signal under active monitoring.",
          state: "Monitoring"
        },
        {
          id: "journal-baseline",
          occurredAt: stamp(365),
          type: "measured",
          label: "Updated the measurement baseline",
          detail: "GO refreshed the starting point it will use to compare results after the next approved change.",
          state: "Baseline saved"
        }
      ];
    }

    buildRevenueModel(opportunity) {
      const monthlyVisitors = 1800;
      const currentConversion = 0.021;
      const modeledLift = Math.max(0.002, Math.min(0.008, opportunity / (monthlyVisitors * 12 * 165)));
      const averageBooking = 165;
      const annual = Math.round(monthlyVisitors * modeledLift * averageBooking * 12);
      return {
        label: "Recoverable revenue being tracked",
        annual: opportunity || annual,
        monthlyVisitors,
        currentConversion,
        modeledLift,
        averageBooking,
        disclaimer: "This is a modeled opportunity, not guaranteed revenue. GO will replace assumptions with connected traffic, conversion, and booking data, then track the result after approval."
      };
    }

    buildHistory(completed) {
      const entries = [
        { date: "Today", type: "GO started work", detail: "Prepared the first improvement and monitoring plan." },
        { date: "Latest scan", type: "Business reviewed", detail: "Findings were ranked across the six Growth Pillars." }
      ];
      return [...completed.map(item => ({ date: item.completedAt || "Completed", type: "Improvement completed", detail: item.title })), ...entries].slice(0, 6);
    }

    recordJournal({ type = "update", label, detail, state = "Updated" }) {
      const entry = {
        id: `journal-${Date.now()}`,
        occurredAt: new Date().toISOString(),
        type,
        label,
        detail,
        state
      };
      this.state.journal = [entry, ...(this.state.journal || [])].slice(0, 12);
      this.memory.journal = this.state.journal;
      this.persist();
      return entry;
    }

    approve(id) {
      const item = this.state.approvals.find(entry => entry.id === id);
      if (!item) return null;
      if (item.status.startsWith("Approved")) {
        const alreadyJournaled = (this.state.journal || []).some(entry =>
          entry.type === "approved" && entry.approvalId === item.id
        );
        if (!alreadyJournaled) {
          const entry = this.recordJournal({
            type: "approved",
            label: `${item.title} moved into implementation`,
            detail: "GO picked up this previously approved work and is moving it forward. No additional task was created for you.",
            state: "GO is working"
          });
          entry.approvalId = item.id;
          this.persist();
        }
        return item;
      }
      item.status = "Approved — GO is working on it";
      item.approvedAt = new Date().toISOString();
      this.memory.approvals = this.state.approvals;
      const journalEntry = this.recordJournal({
        type: "approved",
        label: `${item.title} moved into implementation`,
        detail: "GO moved the prepared improvement into implementation. No additional task was created for you.",
        state: "GO is working"
      });
      journalEntry.approvalId = item.id;
      this.persist();
      return item;
    }

    complete(id) {
      const item = this.state.approvals.find(entry => entry.id === id);
      if (!item) return null;
      const completedItem = { id, title: item.title, completedAt: new Date().toISOString() };
      this.memory.completed = [completedItem, ...(this.memory.completed || [])].slice(0, 20);
      this.state.completed = this.memory.completed;
      this.recordJournal({
        type: "completed",
        label: `${item.title} completed`,
        detail: "GO finished the approved improvement and moved it into measurement so the result can be compared with the saved baseline.",
        state: "Measuring result"
      });
      this.persist();
      return completedItem;
    }

    loadMemory() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { startedAt: new Date().toISOString(), completed: [], approvals: [], journal: [] };
      } catch {
        return { startedAt: new Date().toISOString(), completed: [], approvals: [], journal: [] };
      }
    }

    persist() {
      this.memory.startedAt = this.state?.business?.startedAt || this.memory.startedAt || new Date().toISOString();
      this.memory.journal = this.state?.journal || this.memory.journal || [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memory));
      localStorage.setItem("growthOperatorWorkState", JSON.stringify(this.state));
    }
  }

  window.GOWorkEngine = GOWorkEngine;
})();