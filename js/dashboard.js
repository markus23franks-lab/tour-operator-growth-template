const growthModules = {
    Visibility: {
        score: "65%",
        status: "Needs Attention",
        confidence: 91,
        difficulty: "Easy",
        timeRequired: "2–3 hours",
        successLikelihood: "Very High",
        headline: "More high-intent customers should be finding your business.",
        explanation:
            "Your visibility improved this week, but nearby competitors still appear more often for important local searches.",
        impactLabel: "Estimated annual opportunity",
        impact: "+$14,800",
        actions: [
            {
                title: "Improve your Google Business Profile",
                description:
                    "Update categories, services, business details, photos, and booking links.",
                time: "20 minutes",
                impact: "+$3,200/year"
            },
            {
                title: "Optimize your highest-value tour pages",
                description:
                    "Strengthen local keywords, page titles, headings, and calls-to-action.",
                time: "45 minutes",
                impact: "+$6,700/year"
            },
            {
                title: "Increase review momentum",
                description:
                    "Generate 30 additional Google reviews using automated post-tour requests.",
                time: "1–2 hours",
                impact: "+$4,900/year"
            }
        ]
    },

    Reputation: {
        score: "87%",
        status: "Healthy",
        confidence: 94,
        difficulty: "Easy",
        timeRequired: "1–2 hours",
        successLikelihood: "Very High",
        headline: "Your reputation is strong, but competitor momentum is increasing.",
        explanation:
            "Your rating and recent review momentum build trust. However, River Adventures is currently adding reviews more than twice as quickly.",
        impactLabel: "Estimated annual opportunity",
        impact: "+$8,700",
        actions: [
            {
                title: "Activate automated review requests",
                description:
                    "Send every completed guest a review request by text shortly after their experience.",
                time: "30 minutes",
                impact: "+18 reviews/month"
            },
            {
                title: "Verify your Google review destination",
                description:
                    "Confirm guests are being sent directly to the correct Google review page.",
                time: "10 minutes",
                impact: "Higher completion rate"
            },
            {
                title: "Launch competitor review tracking",
                description:
                    "Monitor weekly review velocity against River Adventures and nearby operators.",
                time: "20 minutes",
                impact: "Protect local visibility"
            }
        ]
    },

    Website: {
        score: "82%",
        status: "Improved",
        confidence: 88,
        difficulty: "Moderate",
        timeRequired: "3–5 hours",
        successLikelihood: "High",
        headline: "Your completed website improvements strengthened mobile performance.",
        explanation:
            "The clearer mobile booking path and improved calls-to-action have made it easier for visitors to complete reservations.",
        impactLabel: "Recovered annual opportunity",
        impact: "+$18,200",
        actions: [
            {
                title: "Monitor mobile conversion",
                description:
                    "Compare mobile conversion before and after your completed changes.",
                time: "20 minutes",
                impact: "Validate improvement"
            },
            {
                title: "Review mobile page speed",
                description:
                    "Confirm major tour pages continue loading quickly on mobile devices.",
                time: "20 minutes",
                impact: "Protect conversion"
            },
            {
                title: "Test the booking call-to-action",
                description:
                    "Run one additional button and headline test on your highest-traffic page.",
                time: "45 minutes",
                impact: "+1–3% conversion"
            }
        ]
    },

    Conversion: {
        score: "76%",
        status: "Improved",
        confidence: 93,
        difficulty: "Moderate",
        timeRequired: "4–6 hours",
        successLikelihood: "Very High",
        headline: "Your mobile booking action plan is complete.",
        explanation:
            "The completed mobile conversion work reduced friction and recovered a meaningful portion of your original revenue opportunity.",
        impactLabel: "Recovered annual opportunity",
        impact: "+$18,200",
        actions: [
            {
                title: "Audit the full mobile booking journey",
                description:
                    "Review every step from landing page through completed payment.",
                time: "45 minutes",
                impact: "Find highest-friction step"
            },
            {
                title: "Clarify pricing and policies",
                description:
                    "Make availability, cancellation terms, and total cost easier to understand.",
                time: "1 hour",
                impact: "+$5,100/year"
            },
            {
                title: "Launch abandoned-booking recovery",
                description:
                    "Use automated text and email follow-up to bring customers back.",
                time: "2–3 hours",
                impact: "+$13,100/year"
            }
        ]
    },

    Automation: {
        score: "54%",
        status: "Needs Attention",
        confidence: 90,
        difficulty: "Moderate",
        timeRequired: "3–4 hours",
        successLikelihood: "High",
        headline: "Several repetitive growth tasks still depend on manual work.",
        explanation:
            "Review requests, customer follow-up, reporting, and repeat-guest marketing can increasingly run automatically.",
        impactLabel: "Estimated time savings",
        impact: "18 hrs/month",
        actions: [
            {
                title: "Automate review and referral requests",
                description:
                    "Trigger customer outreach after each completed reservation.",
                time: "45 minutes",
                impact: "6 hrs saved/month"
            },
            {
                title: "Create repeat-guest campaigns",
                description:
                    "Reconnect with past guests using seasonal offers and reminders.",
                time: "1–2 hours",
                impact: "+$4,600/year"
            },
            {
                title: "Schedule a weekly growth summary",
                description:
                    "Automatically surface the most important business changes.",
                time: "30 minutes",
                impact: "4 hrs saved/month"
            }
        ]
    },

    Intelligence: {
        score: "79%",
        status: "Healthy",
        confidence: 86,
        difficulty: "Moderate",
        timeRequired: "2–4 hours",
        successLikelihood: "High",
        headline: "Your reporting foundation is strong and becoming more useful.",
        explanation:
            "You track most important channels, but several acquisition and competitor signals remain disconnected.",
        impactLabel: "Marketing channels tracked",
        impact: "6 of 8",
        actions: [
            {
                title: "Connect every booking source",
                description:
                    "Bring direct, OTA, referral, paid, and organic bookings into one view.",
                time: "1 hour",
                impact: "Full attribution"
            },
            {
                title: "Track competitor movement",
                description:
                    "Monitor review growth, rankings, offers, and website changes.",
                time: "45 minutes",
                impact: "Earlier opportunity detection"
            },
            {
                title: "Measure change-to-revenue impact",
                description:
                    "Track which website and marketing improvements create bookings.",
                time: "1–2 hours",
                impact: "Better investment decisions"
            }
        ]
    }
};

const STORAGE_KEY = "growthOperatorCompletedActions";

let activeModuleName = null;
let completedActions = loadCompletedActions();

document.addEventListener("DOMContentLoaded", function () {
    createIntelligenceSection();
    createModuleDrawer();
    activateHealthCards();
    activateNavigation();
    activateBriefingButtons();
    activateIntelligenceButtons();
    updateJourneyProgress();
    animateDashboard();
});

function createIntelligenceSection() {
    const briefingGrid = document.querySelector(".go-briefing-grid");

    if (!briefingGrid || document.querySelector(".go-intelligence-section")) {
        return;
    }

    const section = document.createElement("section");

    section.className = "go-intelligence-section";

    section.innerHTML = `
        <div class="go-intelligence-heading">
            <div>
                <p class="go-kicker">GROWTH OPERATOR'S ANALYSIS</p>
                <h2>Why This Matters</h2>
            </div>

            <span class="go-intelligence-badge">
                94% AI Confidence
            </span>
        </div>

        <div class="go-intelligence-layout">

            <article class="go-intelligence-analysis">

                <div class="go-intelligence-icon">
                    AI
                </div>

                <div class="go-intelligence-copy">

                    <span>WHAT I FOUND</span>

                    <h3>
                        Your competitor's review momentum could begin affecting
                        your local visibility.
                    </h3>

                    <p>
                        River Adventures gained 14 reviews this week while your
                        business gained 5. Their current review velocity is more
                        than twice yours.
                    </p>

                    <p>
                        Based on your completed booking volume, Growth Operator
                        estimates that your business should generate approximately
                        18–22 new Google reviews each month.
                    </p>

                </div>

            </article>

            <article class="go-intelligence-forecast">

                <span class="go-intelligence-label">
                    IF NOTHING CHANGES
                </span>

                <strong>6–8 weeks</strong>

                <p>
                    before your local visibility may begin weakening relative
                    to this competitor.
                </p>

                <div class="go-intelligence-meter">

                    <div class="go-intelligence-meter-row">
                        <span>Your review pace</span>
                        <strong>5 / week</strong>
                    </div>

                    <div class="go-intelligence-bar">
                        <span style="width: 36%;"></span>
                    </div>

                    <div class="go-intelligence-meter-row competitor">
                        <span>River Adventures</span>
                        <strong>14 / week</strong>
                    </div>

                    <div class="go-intelligence-bar competitor">
                        <span style="width: 88%;"></span>
                    </div>

                </div>

            </article>

            <article class="go-intelligence-decision">

                <div class="go-intelligence-priority">
                    <span>RECOMMENDED PRIORITY</span>
                    <strong>High</strong>
                </div>

                <div class="go-intelligence-value">
                    <span>POTENTIAL ANNUAL IMPACT</span>
                    <strong>+$8,700</strong>
                </div>

                <p>
                    Activate automated requests now to increase review velocity,
                    protect Google momentum, and close the competitor gap.
                </p>

                <button
                    class="go-primary-button go-intelligence-action"
                    type="button"
                >
                    Open Review Engine →
                </button>

            </article>

        </div>
    `;

    briefingGrid.insertAdjacentElement("afterend", section);
}

function loadCompletedActions() {
    try {
        const storedProgress = localStorage.getItem(STORAGE_KEY);

        if (!storedProgress) {
            return {};
        }

        const parsedProgress = JSON.parse(storedProgress);

        return parsedProgress && typeof parsedProgress === "object"
            ? parsedProgress
            : {};
    } catch (error) {
        console.warn("Growth Operator could not load saved progress.", error);
        return {};
    }
}

function saveCompletedActions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(completedActions)
        );
    } catch (error) {
        console.warn("Growth Operator could not save progress.", error);
    }
}

function createModuleDrawer() {
    const drawer = document.createElement("div");

    drawer.id = "go-module-drawer";
    drawer.className = "go-module-drawer";
    drawer.setAttribute("aria-hidden", "true");

    drawer.innerHTML = `
        <div class="go-drawer-backdrop" data-close-drawer></div>

        <aside class="go-drawer-panel" role="dialog" aria-modal="true">
            <button
                class="go-drawer-close"
                type="button"
                aria-label="Close analysis"
                data-close-drawer
            >
                ×
            </button>

            <div class="go-drawer-eyebrow">AI GROWTH ADVISOR</div>

            <div class="go-drawer-heading">
                <div>
                    <h2 id="go-drawer-title">Reputation</h2>
                    <p id="go-drawer-headline"></p>
                </div>

                <div class="go-drawer-score">
                    <strong id="go-drawer-score">87%</strong>
                    <span id="go-drawer-status">Healthy</span>
                </div>
            </div>

            <div class="go-ai-summary-grid">
                <div class="go-ai-summary-card">
                    <span>AI CONFIDENCE</span>
                    <strong id="go-confidence-value">94%</strong>

                    <div class="go-confidence-track">
                        <div id="go-confidence-fill"></div>
                    </div>
                </div>

                <div class="go-ai-summary-card">
                    <span>DIFFICULTY</span>
                    <strong id="go-difficulty-value">Easy</strong>
                </div>

                <div class="go-ai-summary-card">
                    <span>TIME REQUIRED</span>
                    <strong id="go-time-value">1–2 hours</strong>
                </div>

                <div class="go-ai-summary-card">
                    <span>LIKELIHOOD OF SUCCESS</span>
                    <strong id="go-success-value">Very High</strong>
                </div>
            </div>

            <div class="go-drawer-section">
                <h3>What Growth Operator Found</h3>
                <p id="go-drawer-explanation"></p>
            </div>

            <div class="go-drawer-impact">
                <span id="go-drawer-impact-label"></span>
                <strong id="go-drawer-impact"></strong>
            </div>

            <div class="go-action-plan-heading">
                <div>
                    <h3>Your Action Plan</h3>
                    <p id="go-action-progress-text">0 of 3 completed</p>
                </div>

                <strong id="go-action-progress-percent">0%</strong>
            </div>

            <div class="go-action-progress-track">
                <div id="go-action-progress-fill"></div>
            </div>

            <div id="go-drawer-actions" class="go-drawer-actions"></div>

            <button
                id="go-start-plan-button"
                class="go-primary-button go-drawer-action-button"
                type="button"
            >
                Start Fixing This →
            </button>
        </aside>
    `;

    document.body.appendChild(drawer);

    drawer.querySelectorAll("[data-close-drawer]").forEach(function (element) {
        element.addEventListener("click", closeModuleDrawer);
    });

    document
        .getElementById("go-start-plan-button")
        .addEventListener("click", handleStartPlan);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeModuleDrawer();
        }
    });
}

function activateHealthCards() {
    const cards = document.querySelectorAll(".go-health-card");

    cards.forEach(function (card) {
        const titleElement = card.querySelector(".go-health-title h3");

        if (!titleElement) {
            return;
        }

        const moduleName = titleElement.textContent.trim();

        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Open ${moduleName} analysis`);

        if (!card.querySelector(".go-card-prompt")) {
            const prompt = document.createElement("span");

            prompt.className = "go-card-prompt";
            prompt.textContent = "View analysis →";

            card.appendChild(prompt);
        }

        card.addEventListener("click", function () {
            openModuleDrawer(moduleName);
        });

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openModuleDrawer(moduleName);
            }
        });
    });
}

function activateBriefingButtons() {
    const priorityButton = document.querySelector(
        ".go-advisor-card .go-primary-button"
    );

    if (priorityButton) {
        priorityButton.addEventListener("click", function () {
            openModuleDrawer("Reputation");
        });
    }

    const journeyButton = document.querySelector(
        ".go-journey-now .go-primary-button"
    );

    if (journeyButton) {
        journeyButton.addEventListener("click", function () {
            openModuleDrawer("Reputation");
        });
    }

    const competitorButton = document.querySelector(
        ".go-briefing-change-card.warning .go-text-button"
    );

    if (competitorButton) {
        competitorButton.addEventListener("click", function () {
            openModuleDrawer("Reputation");
        });
    }
}

function activateIntelligenceButtons() {
    const intelligenceButton = document.querySelector(
        ".go-intelligence-action"
    );

    if (!intelligenceButton) {
        return;
    }

    intelligenceButton.addEventListener("click", function () {
        openModuleDrawer("Reputation");
    });
}

function openModuleDrawer(moduleName) {
    const module = growthModules[moduleName];

    if (!module) {
        return;
    }

    activeModuleName = moduleName;

    if (!Array.isArray(completedActions[moduleName])) {
        completedActions[moduleName] = [];
    }

    document.getElementById("go-drawer-title").textContent =
        moduleName;

    document.getElementById("go-drawer-score").textContent =
        module.score;

    document.getElementById("go-drawer-status").textContent =
        module.status;

    document.getElementById("go-drawer-headline").textContent =
        module.headline;

    document.getElementById("go-drawer-explanation").textContent =
        module.explanation;

    document.getElementById("go-drawer-impact-label").textContent =
        module.impactLabel;

    document.getElementById("go-drawer-impact").textContent =
        module.impact;

    document.getElementById("go-confidence-value").textContent =
        `${module.confidence}%`;

    document.getElementById("go-confidence-fill").style.width =
        `${module.confidence}%`;

    document.getElementById("go-difficulty-value").textContent =
        module.difficulty;

    document.getElementById("go-time-value").textContent =
        module.timeRequired;

    document.getElementById("go-success-value").textContent =
        module.successLikelihood;

    renderActions();
    updateDrawerProgress();

    const drawer = document.getElementById("go-module-drawer");

    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");

    document.body.classList.add("go-drawer-open");
}

function renderActions() {
    const module = growthModules[activeModuleName];
    const completed = completedActions[activeModuleName] || [];
    const actionContainer = document.getElementById(
        "go-drawer-actions"
    );

    actionContainer.innerHTML = module.actions
        .map(function (action, index) {
            const isComplete = completed.includes(index);

            return `
                <button
                    type="button"
                    class="go-drawer-action ${isComplete ? "complete" : ""}"
                    data-action-index="${index}"
                >
                    <span class="go-action-check">
                        ${isComplete ? "✓" : index + 1}
                    </span>

                    <div class="go-action-copy">
                        <strong>${action.title}</strong>

                        <p>${action.description}</p>

                        <div class="go-action-meta">
                            <span>⏱ ${action.time}</span>
                            <span>↗ ${action.impact}</span>
                        </div>
                    </div>
                </button>
            `;
        })
        .join("");

    actionContainer
        .querySelectorAll("[data-action-index]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                const index = Number(button.dataset.actionIndex);
                toggleAction(index);
            });
        });
}

function toggleAction(index) {
    const completed = completedActions[activeModuleName] || [];

    if (completed.includes(index)) {
        completedActions[activeModuleName] = completed.filter(
            function (item) {
                return item !== index;
            }
        );
    } else {
        completedActions[activeModuleName] = [
            ...completed,
            index
        ];
    }

    saveCompletedActions();
    renderActions();
    updateDrawerProgress();
    updateJourneyProgress();
}

function updateDrawerProgress() {
    const module = growthModules[activeModuleName];
    const completed = completedActions[activeModuleName] || [];
    const total = module.actions.length;
    const percent = Math.round(
        (completed.length / total) * 100
    );

    document.getElementById(
        "go-action-progress-text"
    ).textContent = `${completed.length} of ${total} completed`;

    document.getElementById(
        "go-action-progress-percent"
    ).textContent = `${percent}%`;

    document.getElementById(
        "go-action-progress-fill"
    ).style.width = `${percent}%`;

    const button = document.getElementById(
        "go-start-plan-button"
    );

    if (percent === 100) {
        button.textContent = "Action Plan Complete ✓";
        button.classList.add("complete");
    } else if (percent > 0) {
        button.textContent = "Continue My Action Plan →";
        button.classList.remove("complete");
    } else {
        button.textContent = "Start Fixing This →";
        button.classList.remove("complete");
    }
}

function handleStartPlan() {
    const module = growthModules[activeModuleName];
    const completed = completedActions[activeModuleName] || [];

    if (completed.length === module.actions.length) {
        return;
    }

    const firstIncompleteIndex = module.actions.findIndex(
        function (_, index) {
            return !completed.includes(index);
        }
    );

    if (firstIncompleteIndex >= 0) {
        toggleAction(firstIncompleteIndex);
    }
}

function updateJourneyProgress() {
    const reputationCompleted =
        completedActions.Reputation || [];

    const completedCount = reputationCompleted.length;
    const totalActions =
        growthModules.Reputation.actions.length;

    const reputationPercent = Math.round(
        (completedCount / totalActions) * 100
    );

    const baseJourneyPercent = 58;
    const addedJourneyPercent = Math.round(
        reputationPercent * 0.17
    );

    const journeyPercent = Math.min(
        75,
        baseJourneyPercent + addedJourneyPercent
    );

    const journeyDay = Math.min(
        68,
        52 + Math.round(completedCount * 5.3)
    );

    const progressLabel = document.querySelector(
        ".go-plan-progress"
    );

    const dayNumber = document.querySelector(
        ".go-journey-summary-score strong"
    );

    const currentStageTitle = document.querySelector(
        ".go-journey-summary > div:first-child > strong"
    );

    const currentStageDescription = document.querySelector(
        ".go-journey-summary > div:first-child > p"
    );

    const nextStepTitle = document.querySelector(
        ".go-journey-now strong"
    );

    const nextStepDescription = document.querySelector(
        ".go-journey-now p"
    );

    const journeyButton = document.querySelector(
        ".go-journey-now .go-primary-button"
    );

    if (progressLabel) {
        progressLabel.textContent =
            `${journeyPercent}% Complete`;
    }

    if (dayNumber) {
        dayNumber.textContent = String(journeyDay);
    }

    if (
        completedCount === totalActions &&
        totalActions > 0
    ) {
        if (currentStageTitle) {
            currentStageTitle.textContent =
                "Review Engine Complete";
        }

        if (currentStageDescription) {
            currentStageDescription.textContent =
                "Your review automation and competitor monitoring foundation is complete. Growth Operator is ready to begin measuring ongoing results.";
        }

        if (nextStepTitle) {
            nextStepTitle.textContent =
                "Unlock Growth Tracking.";
        }

        if (nextStepDescription) {
            nextStepDescription.textContent =
                "Growth Operator will now track score movement, review velocity, ranking gains, and estimated revenue created by your completed actions.";
        }

        if (journeyButton) {
            journeyButton.textContent =
                "Open Growth Tracking →";

            journeyButton.onclick = function () {
                openModuleDrawer("Intelligence");
            };
        }

        updateReviewJourneyStep(true);
        updateTrackingJourneyStep(true);
    } else {
        if (currentStageTitle) {
            currentStageTitle.textContent =
                "Review Engine";
        }

        if (currentStageDescription) {
            currentStageDescription.textContent =
                "Your website improvement stage is complete. Growth Operator is now focused on increasing review velocity and strengthening your local reputation.";
        }

        if (nextStepTitle) {
            nextStepTitle.textContent =
                "Activate your Review Engine.";
        }

        if (nextStepDescription) {
            nextStepDescription.textContent =
                "Complete the three reputation actions to increase review volume, protect your rating, and unlock Growth Tracking.";
        }

        if (journeyButton) {
            journeyButton.textContent =
                completedCount > 0
                    ? "Continue Review Engine →"
                    : "Open Review Engine →";

            journeyButton.onclick = function () {
                openModuleDrawer("Reputation");
            };
        }

        updateReviewJourneyStep(false);
        updateTrackingJourneyStep(false);
    }
}

function updateReviewJourneyStep(isComplete) {
    const steps = document.querySelectorAll(
        ".go-journey-step"
    );

    const reviewStep = steps[3];

    if (!reviewStep) {
        return;
    }

    const marker = reviewStep.querySelector(
        ".go-step-marker"
    );

    const status = reviewStep.querySelector("small");

    if (isComplete) {
        reviewStep.classList.remove("current");
        reviewStep.classList.add("complete");

        if (marker) {
            marker.textContent = "✓";
        }

        if (status) {
            status.textContent = "Complete";
        }
    } else {
        reviewStep.classList.remove("complete");
        reviewStep.classList.add("current");

        if (marker) {
            marker.textContent = "4";
        }

        if (status) {
            status.textContent =
                (completedActions.Reputation || []).length > 0
                    ? "In Progress"
                    : "Ready";
        }
    }
}

function updateTrackingJourneyStep(isCurrent) {
    const steps = document.querySelectorAll(
        ".go-journey-step"
    );

    const trackingStep = steps[4];

    if (!trackingStep) {
        return;
    }

    const marker = trackingStep.querySelector(
        ".go-step-marker"
    );

    const status = trackingStep.querySelector("small");

    if (isCurrent) {
        trackingStep.classList.add("current");

        if (marker) {
            marker.textContent = "5";
        }

        if (status) {
            status.textContent = "Ready";
        }
    } else {
        trackingStep.classList.remove("current");

        if (marker) {
            marker.textContent = "5";
        }

        if (status) {
            status.textContent = "Not Started";
        }
    }
}

function closeModuleDrawer() {
    const drawer = document.getElementById(
        "go-module-drawer"
    );

    if (!drawer) {
        return;
    }

    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");

    document.body.classList.remove("go-drawer-open");
}

function activateNavigation() {
    const links = document.querySelectorAll(
        ".go-nav-link"
    );

    links.forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            links.forEach(function (item) {
                item.classList.remove("active");
            });

            link.classList.add("active");
        });
    });
}

function animateDashboard() {
    const animatedElements = document.querySelectorAll(
        ".go-briefing-card, .go-briefing-change-card, .go-intelligence-section, .go-advisor-card, .go-weekly-win-card, .go-score-card, .go-revenue-card, .go-health-card, .go-journey-card, .go-feed-card"
    );

    animatedElements.forEach(function (element, index) {
        element.style.setProperty(
            "--go-animation-delay",
            `${index * 45}ms`
        );

        element.classList.add("go-reveal");
    });
}