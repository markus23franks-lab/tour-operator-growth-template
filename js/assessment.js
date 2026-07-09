const form = document.getElementById("growth-form");
const loadingScreen = document.getElementById("loading-screen");
const results = document.getElementById("results");

const reportTitle = document.getElementById("report-title");
const scoreNumber = document.getElementById("score-number");
const scoreMessage = document.getElementById("score-message");
const businessProfile = document.getElementById("business-profile");
const topOpportunity = document.getElementById("top-opportunity");
const revenueOpportunity = document.getElementById("revenue-opportunity");
const growthRoadmap = document.getElementById("growth-roadmap");
const businessHealth = document.getElementById("business-health");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const businessName = document.getElementById("business-name").value || "Your business";
    const bookingSoftware = document.getElementById("booking-software").value;
    const seoConfidence = document.getElementById("seo-confidence").value;
    const reviewSystem = document.getElementById("review-system").value;
    const trackingConfidence = document.getElementById("tracking-confidence").value;

    const scores = calculateScores(bookingSoftware, seoConfidence, reviewSystem, trackingConfidence);
    const totalScore = Math.round(
        (scores.visibility + scores.trust + scores.conversion + scores.operations + scores.intelligence + scores.growth) / 6
    );

    const weakestArea = getWeakestArea(scores);

    form.style.display = "none";
    loadingScreen.style.display = "block";

    setTimeout(function () {
        reportTitle.textContent = `${businessName} Growth Score`;
        scoreNumber.textContent = totalScore + " / 100";

        scoreMessage.textContent = getScoreMessage(totalScore, businessName);
        businessProfile.textContent = getBusinessProfile(totalScore, trackingConfidence, seoConfidence);
        topOpportunity.textContent = getTopOpportunity(weakestArea);
        revenueOpportunity.textContent = getRevenueOpportunity(totalScore);
        businessHealth.innerHTML = getBusinessHealthHTML(scores);
        growthRoadmap.innerHTML = getRoadmapHTML(weakestArea);

        loadingScreen.style.display = "none";
        results.style.display = "block";
    }, 1800);
});

function calculateScores(bookingSoftware, seoConfidence, reviewSystem, trackingConfidence) {
    let visibility = 78;
    let trust = 76;
    let conversion = 82;
    let operations = 72;
    let intelligence = 68;
    let growth = 78;

    if (bookingSoftware === "FareHarbor") {
        conversion -= 4;
        operations -= 4;
    } else if (bookingSoftware === "Rezdy" || bookingSoftware === "Checkfront") {
        conversion -= 7;
        operations -= 5;
    } else if (bookingSoftware === "Other / Not Sure") {
        conversion -= 12;
        operations -= 8;
        intelligence -= 6;
    }

    if (seoConfidence === "Somewhat — but we could do better") {
        visibility -= 10;
        growth -= 4;
    } else if (seoConfidence === "No — we are not getting enough leads") {
        visibility -= 24;
        growth -= 10;
    } else if (seoConfidence === "Not sure") {
        visibility -= 18;
        intelligence -= 8;
    }

    if (reviewSystem === "No") {
        trust -= 20;
        operations -= 8;
        growth -= 6;
    } else if (reviewSystem === "Not sure") {
        trust -= 12;
        operations -= 5;
        intelligence -= 4;
    }

    if (trackingConfidence === "Somewhat") {
        intelligence -= 15;
        growth -= 5;
    } else if (trackingConfidence === "No — we are guessing") {
        intelligence -= 30;
        growth -= 10;
        operations -= 6;
    }

    return {
        visibility,
        trust,
        conversion,
        operations,
        intelligence,
        growth
    };
}

function getWeakestArea(scores) {
    return Object.entries(scores).sort(function (a, b) {
        return a[1] - b[1];
    })[0][0];
}

function getBusinessHealthHTML(scores) {
    const cards = [
        {
            key: "visibility",
            icon: "👀",
            title: "Visibility",
            description: "Can customers find you on Google, maps, local search, and emerging AI search?"
        },
        {
            key: "trust",
            icon: "⭐",
            title: "Trust",
            description: "Do your reviews, photos, and social proof make customers confident enough to book?"
        },
        {
            key: "conversion",
            icon: "🎯",
            title: "Conversion",
            description: "When visitors arrive, does your website and booking flow make it easy to take action?"
        },
        {
            key: "operations",
            icon: "⚙️",
            title: "Operations",
            description: "Are repetitive tasks automated so your business can grow without adding more manual work?"
        },
        {
            key: "intelligence",
            icon: "📊",
            title: "Intelligence",
            description: "Do you know what is actually creating bookings, revenue, and growth?"
        },
        {
            key: "growth",
            icon: "🚀",
            title: "Growth",
            description: "Is your business improving every month instead of quietly falling behind?"
        }
    ];

    return cards.map(function (card) {
        const score = scores[card.key];
        return `
            <div class="health-card">
                <div class="health-header">
                    <h4>${card.icon} ${card.title}</h4>
                    <strong>${score}%</strong>
                </div>

                <div class="progress-bar">
                    <div class="progress-fill" style="width:${score}%;"></div>
                </div>

                <p>${card.description}</p>
            </div>
        `;
    }).join("");
}

function getScoreMessage(totalScore, businessName) {
    if (totalScore >= 85) {
        return `${businessName} has a strong growth foundation. The next opportunity is optimization, tracking, and consistent improvement.`;
    }

    if (totalScore >= 70) {
        return `${businessName} is doing several things well, but disconnected growth systems are likely costing bookings.`;
    }

    return `${businessName} has meaningful growth potential, but several foundational systems need attention.`;
}

function getBusinessProfile(totalScore, trackingConfidence, seoConfidence) {
    if (trackingConfidence === "No — we are guessing") {
        return "You are likely operating without clear visibility into what is actually driving bookings. This creates scaling risk and makes marketing decisions harder than they need to be.";
    }

    if (seoConfidence === "No — we are not getting enough leads") {
        return "Your business likely has a visibility gap. Customers may be searching, but competitors may be capturing demand before you appear.";
    }

    if (totalScore >= 85) {
        return "You are a strong operator with a solid foundation. Your biggest opportunity is staying ahead through better insight, monitoring, and optimization.";
    }

    return "You have the foundation of a strong operator, but several growth systems appear disconnected or underused.";
}

function getTopOpportunity(weakestArea) {
    const opportunities = {
        visibility: "Improve your visibility so more high-intent customers find you before they find competitors.",
        trust: "Build a stronger trust engine through consistent reviews, social proof, and reputation management.",
        conversion: "Improve the path from website visitor to booked customer by reducing friction and strengthening calls-to-action.",
        operations: "Automate repetitive growth tasks so the business can scale without relying on constant manual work.",
        intelligence: "Improve tracking and reporting so you know exactly what is creating bookings and where to invest next.",
        growth: "Create a repeatable monthly growth system so the business keeps improving instead of plateauing."
    };

    return opportunities[weakestArea];
}

function getRevenueOpportunity(totalScore) {
    if (totalScore >= 85) {
        return "$12,000 - $28,000 annually";
    }

    if (totalScore >= 70) {
        return "$25,000 - $55,000 annually";
    }

    return "$50,000 - $120,000 annually";
}

function getRoadmapHTML(weakestArea) {
    const roadmaps = {
        visibility: [
            ["Weeks 1–2", "Improve Google visibility and optimize high-value search pages."],
            ["Weeks 3–4", "Strengthen Google Business Profile and local content."],
            ["Month 2", "Create pages that answer high-intent customer searches."],
            ["Month 3", "Monitor keyword movement and adjust based on results."]
        ],
        trust: [
            ["Weeks 1–2", "Launch a consistent post-trip review request process."],
            ["Weeks 3–4", "Add stronger review placement across the website."],
            ["Month 2", "Create a review response and reputation management rhythm."],
            ["Month 3", "Build a repeatable monthly trust-building system."]
        ],
        conversion: [
            ["Weeks 1–2", "Clarify homepage messaging and booking calls-to-action."],
            ["Weeks 3–4", "Improve tour pages, photos, FAQs, and urgency."],
            ["Month 2", "Reduce friction in the booking path."],
            ["Month 3", "Test stronger offers, packages, and booking prompts."]
        ],
        operations: [
            ["Weeks 1–2", "Identify repetitive manual work that can be automated."],
            ["Weeks 3–4", "Automate reviews, follow-up, and lead capture."],
            ["Month 2", "Create standard operating workflows."],
            ["Month 3", "Build a simple growth dashboard."]
        ],
        intelligence: [
            ["Weeks 1–2", "Set up clearer tracking for where bookings come from."],
            ["Weeks 3–4", "Connect website, booking, and marketing data."],
            ["Month 2", "Build a monthly growth report."],
            ["Month 3", "Use data to decide where to invest next."]
        ],
        growth: [
            ["Weeks 1–2", "Define the highest-value growth opportunities."],
            ["Weeks 3–4", "Prioritize the fastest revenue wins."],
            ["Month 2", "Build the first monthly growth system."],
            ["Month 3", "Review score movement and adjust the roadmap."]
        ]
    };

    return `
        <hr>
        <h3>If We Joined Your Team Tomorrow</h3>
        ${roadmaps[weakestArea].map(function ([time, action]) {
            return `
                <div class="roadmap-step">
                    <strong>${time}</strong>
                    <p>${action}</p>
                </div>
            `;
        }).join("")}

        <h3>Recommended Next Step</h3>
        <p>
            Build a 90-day Growth Plan that shows what to fix first, what can wait,
            and where the fastest revenue opportunity likely exists.
        </p>
    `;
}