const form = document.getElementById("growth-form");
const results = document.getElementById("results");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const website = Number(document.getElementById("website").value);
  const reviews = Number(document.getElementById("reviews").value);
  const seo = Number(document.getElementById("seo").value);
  const booking = Number(document.getElementById("booking").value);
  const automation = Number(document.getElementById("automation").value);

  const scores = {
    Website: website,
    Reviews: reviews,
    SEO: seo,
    Booking: booking,
    Automation: automation,
  };

  const totalScore = Math.round(
    (website + reviews + seo + booking + automation) / 5
  );

  const weakestArea = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];

  const revenueOpportunity = Math.round((100 - totalScore) * 1800);

  const roadmap = generateRoadmap(weakestArea, revenueOpportunity);

  results.innerHTML = `
    <div class="results-card">
      <h2>Your Growth Score</h2>
      <div class="score-circle">${totalScore}</div>
      <p class="score-label">out of 100</p>

      <h3>Score Breakdown</h3>
      <div class="score-grid">
        ${Object.entries(scores)
          .map(
            ([label, score]) => `
            <div class="score-item">
              <span>${label}</span>
              <strong>${score}/100</strong>
            </div>
          `
          )
          .join("")}
      </div>

      <div class="opportunity-box">
        <h3>Top Growth Opportunity</h3>
        <p>Your biggest opportunity right now is <strong>${weakestArea}</strong>.</p>
      </div>

      <div class="revenue-box">
        <h3>Estimated Revenue Opportunity</h3>
        <p>$${revenueOpportunity.toLocaleString()} per year</p>
      </div>

      <div class="roadmap">
        <h3>Your 90-Day Growth Roadmap</h3>
        ${roadmap}
      </div>

      <button class="cta-button">Schedule a Growth Strategy Call</button>
    </div>
  `;
});

function generateRoadmap(weakestArea, revenueOpportunity) {
  const monthlyImpact = Math.round(revenueOpportunity / 12);

  const plans = {
    Website: [
      ["Weeks 1–2", "Improve homepage headline, call-to-action, and trust signals.", monthlyImpact * 0.2],
      ["Weeks 3–4", "Add stronger tour pages with photos, FAQs, and booking buttons.", monthlyImpact * 0.25],
      ["Month 2", "Improve mobile speed and simplify the path to booking.", monthlyImpact * 0.25],
      ["Month 3", "Add conversion tracking and test new offer positioning.", monthlyImpact * 0.3],
    ],
    Reviews: [
      ["Weeks 1–2", "Create a simple post-tour review request system.", monthlyImpact * 0.2],
      ["Weeks 3–4", "Add Google review links across email and SMS follow-ups.", monthlyImpact * 0.25],
      ["Month 2", "Feature best reviews on homepage and tour pages.", monthlyImpact * 0.25],
      ["Month 3", "Build a monthly review growth process.", monthlyImpact * 0.3],
    ],
    SEO: [
      ["Weeks 1–2", "Optimize homepage title, description, and local keywords.", monthlyImpact * 0.2],
      ["Weeks 3–4", "Improve top tour pages for search intent.", monthlyImpact * 0.25],
      ["Month 2", "Create local content targeting high-intent searches.", monthlyImpact * 0.25],
      ["Month 3", "Build backlinks and strengthen Google Business Profile.", monthlyImpact * 0.3],
    ],
    Booking: [
      ["Weeks 1–2", "Reduce friction in the booking flow.", monthlyImpact * 0.2],
      ["Weeks 3–4", "Improve pricing, availability, and urgency messaging.", monthlyImpact * 0.25],
      ["Month 2", "Add abandoned booking follow-up.", monthlyImpact * 0.25],
      ["Month 3", "Test packages, upsells, and repeat booking offers.", monthlyImpact * 0.3],
    ],
    Automation: [
      ["Weeks 1–2", "Set up automated lead follow-up.", monthlyImpact * 0.2],
      ["Weeks 3–4", "Create post-tour review and referral automation.", monthlyImpact * 0.25],
      ["Month 2", "Add abandoned booking recovery emails or texts.", monthlyImpact * 0.25],
      ["Month 3", "Build a monthly growth dashboard.", monthlyImpact * 0.3],
    ],
  };

  return plans[weakestArea]
    .map(
      ([time, action, impact]) => `
      <div class="roadmap-step">
        <div>
          <span class="roadmap-time">${time}</span>
          <p>${action}</p>
        </div>
        <strong>+$${Math.round(impact).toLocaleString()}/mo</strong>
      </div>
    `
    )
    .join("");
}