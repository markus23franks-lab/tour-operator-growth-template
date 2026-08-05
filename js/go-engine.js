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

    approve(id) {
      const item = this.state.approvals.find(entry => entry.id === id);
      if (!item) return null;
      item.status = "Approved — GO is working on it";
      item.approvedAt = new Date().toISOString();
      this.memory.approvals = this.state.approvals;
      this.persist();
      return item;
    }

    complete(id) {
      const item = this.state.approvals.find(entry => entry.id === id);
      if (!item) return null;
      const completedItem = { id, title: item.title, completedAt: new Date().toISOString() };
      this.memory.completed = [completedItem, ...(this.memory.completed || [])].slice(0, 20);
      this.state.completed = this.memory.completed;
      this.persist();
      return completedItem;
    }

    loadMemory() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { startedAt: new Date().toISOString(), completed: [], approvals: [] };
      } catch {
        return { startedAt: new Date().toISOString(), completed: [], approvals: [] };
      }
    }

    persist() {
      this.memory.startedAt = this.state?.business?.startedAt || this.memory.startedAt || new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memory));
      localStorage.setItem("growthOperatorWorkState", JSON.stringify(this.state));
    }
  }

  window.GOWorkEngine = GOWorkEngine;
})();