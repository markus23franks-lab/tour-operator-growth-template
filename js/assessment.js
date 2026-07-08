const form = document.getElementById("growth-form");
const loadingScreen = document.getElementById("loading-screen");
const results = document.getElementById("results");

const scoreNumber = document.getElementById("score-number");
const websiteScore = document.getElementById("website-score");
const reviewsScore = document.getElementById("reviews-score");
const seoScore = document.getElementById("seo-score");
const bookingScore = document.getElementById("booking-score");
const automationScore = document.getElementById("automation-score");

const scoreMessage = document.getElementById("score-message");
const topOpportunity = document.getElementById("top-opportunity");
const revenueOpportunity = document.getElementById("revenue-opportunity");
const growthRoadmap = document.getElementById("growth-roadmap");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const businessName = document.getElementById("business-name").value;
    const bookingSoftware = document.getElementById("booking-software").value;

    const website = 18;
    const reviews = 15;
    const seo = 14;
    const booking = getBookingScore(bookingSoftware);
    const automation = 12;

    const totalScore = website + reviews + seo + booking + automation;

    const scores = {
        Website: website,
        Reviews: reviews,
        SEO: seo,
        "Booking Experience": booking,
        Automation: automation
    };

    const weakestArea = Object.entries(scores).sort(function (a, b) {
        return a[1] - b[1];
    })[0][0];

    form.style.display = "none";
    loadingScreen.style.display = "block";

    setTimeout(function () {
        scoreNumber.textContent = totalScore + " / 100";

        websiteScore.textContent = website;
        reviewsScore.textContent = reviews;
        seoScore.textContent = seo;
        bookingScore.textContent = booking;
        automationScore.textContent = automation;

        scoreMessage.textContent = getScoreMessage(totalScore, businessName);
        topOpportunity.textContent = getTopOpportunity(weakestArea);
        revenueOpportunity.textContent = getRevenueOpportunity(totalScore);

        growthRoadmap.innerHTML = getRoadmapHTML(weakestArea);

        loadingScreen.style.display = "none";
        results.style.display = "block";
    }, 1800);
});

function getBookingScore(bookingSoftware) {
    if (bookingSoftware === "Peek Pro" || bookingSoftware === "FareHarbor") {
        return 17;
    }

    if (bookingSoftware === "Rezdy" || bookingSoftware === "Checkfront") {
        return 15;
    }

    return 12;
}

function getScoreMessage(totalScore, businessName) {
    const name = businessName ? businessName : "Your business";

    if (totalScore >= 85) {
        return `${name} has a strong foundation, but there are still clear ways to increase direct bookings, improve follow-up, and capture more revenue.`;
    }

    if (totalScore >= 70) {
        return `${name} is doing some things well, but there are several missed opportunities across visibility, trust, booking flow, and automation.`;
    }

    return `${name} is likely leaving meaningful revenue on the table through weak visibility, booking friction, or missed follow-up.`;
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

function getTopOpportunity(weakestArea) {
    const opportunities = {
        Website: "Improve the website so visitors understand the offer faster and have a clearer path to book.",
        Reviews: "Create a stronger review generation system and use reviews as trust signals across the website.",
        SEO: "Improve local SEO visibility so more high-intent customers find the business before competitors.",
        "Booking Experience": "Reduce booking friction and make it easier for customers to take action.",
        Automation: "Add automated follow-up, review requests, and abandoned booking recovery."
    };

    return opportunities[weakestArea];
}

function getRoadmapHTML(weakestArea) {
    const roadmaps = {
        Website: [
            ["Weeks 1–2", "Improve homepage headline, call-to-action, and trust signals."],
            ["Weeks 3–4", "Upgrade top tour pages with stronger photos, FAQs, and booking buttons."],
            ["Month 2", "Improve mobile speed and simplify the path from visitor to booking."],
            ["Month 3", "Add conversion tracking and test a stronger direct booking offer."]
        ],
        Reviews: [
            ["Weeks 1–2", "Create a simple post-tour Google review request system."],
            ["Weeks 3–4", "Add review links to email and SMS follow-ups."],
            ["Month 2", "Feature best reviews on the homepage and tour pages."],
            ["Month 3", "Build a repeatable monthly review growth process."]
        ],
        SEO: [
            ["Weeks 1–2", "Optimize homepage title, description, and local keywords."],
            ["Weeks 3–4", "Improve top tour pages for high-intent searches."],
            ["Month 2", "Create local content targeting searches customers already make."],
            ["Month 3", "Strengthen Google Business Profile and build local backlinks."]
        ],
        "Booking Experience": [
            ["Weeks 1–2", "Reduce friction in the booking flow."],
            ["Weeks 3–4", "Improve pricing, availability, urgency, and trust messaging."],
            ["Month 2", "Add abandoned booking follow-up."],
            ["Month 3", "Test packages, upsells, and repeat booking offers."]
        ],
        Automation: [
            ["Weeks 1–2", "Set up automated lead follow-up."],
            ["Weeks 3–4", "Create post-tour review and referral automation."],
            ["Month 2", "Add abandoned booking recovery emails or texts."],
            ["Month 3", "Build a monthly growth dashboard."]
        ]
    };

    const steps = roadmaps[weakestArea]
        .map(function ([time, action]) {
            return `
                <div class="roadmap-step">
                    <strong>${time}</strong>
                    <p>${action}</p>
                </div>
            `;
        })
        .join("");

    return `
        <hr>
        <h3>Your 90-Day Growth Roadmap</h3>
        ${steps}

        <h3>Recommended Next Step</h3>
        <p>
            Book a free Growth Blueprint call to review your score, identify the fastest revenue opportunity,
            and build a focused plan for the next 90 days.
        </p>
    `;
}