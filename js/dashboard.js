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
    createModuleDrawer();
    createExecutionOverlay();
    activateHealthCards();
    activateNavigation();
    activateBriefingButtons();
    activateIntelligenceButtons();
    activateExecutionButtons();
    updateJourneyProgress();
    syncExecutionStateToDashboard();
    activateOperatorExperience();
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

            <div class="go-drawer-eyebrow">GROWTH OPERATOR ANALYSIS</div>

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
                Build This With Me →
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
        button.textContent = "Continue Building →";
        button.classList.remove("complete");
    } else {
        button.textContent = "Build This With Me →";
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
/* =========================================================
   GROWTH OPERATOR BUILD 003 — GUIDED EXECUTION
   ========================================================= */

const EXECUTION_STORAGE_KEY = "growthOperatorReviewEngineExecution";

const defaultExecutionState = {
    currentStep: 0,
    timing: "30 minutes after the tour",
    message:
        "Thanks for joining Blue River Rafting today! If you had a great experience, would you mind leaving us a quick Google review? It really helps our local team. {{review_link}}",
    reviewLink: "https://g.page/r/blue-river-rafting/review",
    completed: false,
    activatedAt: null
};

let executionState = loadExecutionState();

const executionSteps = [
    {
        eyebrow: "STEP 1 OF 5 · SEND TIMING",
        title: "When should guests receive the review request?",
        description:
            "I recommend sending it while the experience is still fresh, but after guests have had a moment to settle in.",
        render: renderExecutionTimingStep
    },
    {
        eyebrow: "STEP 2 OF 5 · REVIEW MESSAGE",
        title: "Here is the message I would send.",
        description:
            "It is short, personal, and makes the request feel helpful instead of promotional.",
        render: renderExecutionMessageStep
    },
    {
        eyebrow: "STEP 3 OF 5 · REVIEW DESTINATION",
        title: "Where should the button send guests?",
        description:
            "The fewest possible clicks usually produce the strongest completion rate.",
        render: renderExecutionLinkStep
    },
    {
        eyebrow: "STEP 4 OF 5 · TEST THE EXPERIENCE",
        title: "Let’s test the full customer journey.",
        description:
            "I checked the trigger, timing, message, and review destination before activation.",
        render: renderExecutionTestStep
    },
    {
        eyebrow: "STEP 5 OF 5 · ACTIVATE",
        title: "Your Review Engine is ready.",
        description:
            "Once activated, Growth Operator will remember this decision and begin monitoring the result.",
        render: renderExecutionActivationStep
    }
];

function loadExecutionState() {
    try {
        const stored = localStorage.getItem(EXECUTION_STORAGE_KEY);

        if (!stored) {
            return { ...defaultExecutionState };
        }

        const parsed = JSON.parse(stored);

        return {
            ...defaultExecutionState,
            ...(parsed && typeof parsed === "object" ? parsed : {})
        };
    } catch (error) {
        console.warn("Growth Operator could not load execution progress.", error);
        return { ...defaultExecutionState };
    }
}

function saveExecutionState() {
    try {
        localStorage.setItem(
            EXECUTION_STORAGE_KEY,
            JSON.stringify(executionState)
        );
    } catch (error) {
        console.warn("Growth Operator could not save execution progress.", error);
    }
}

function createExecutionOverlay() {
    if (document.getElementById("go-execution-overlay")) {
        return;
    }

    const overlay = document.createElement("div");

    overlay.id = "go-execution-overlay";
    overlay.className = "go-execution-overlay";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML = `
        <div class="go-execution-shell" role="dialog" aria-modal="true" aria-labelledby="go-execution-title">
            <header class="go-execution-topbar">
                <div class="go-execution-brand">
                    <div class="go-logo-mark" aria-hidden="true">
                        <span class="go-logo-ring"></span>
                        <span class="go-logo-arrow"></span>
                    </div>

                    <div>
                        <strong>GROWTH OPERATOR</strong>
                        <span>GUIDED EXECUTION</span>
                    </div>
                </div>

                <button
                    class="go-execution-close"
                    type="button"
                    aria-label="Close guided execution"
                    data-close-execution
                >
                    ×
                </button>
            </header>

            <div class="go-execution-progress-wrap">
                <div class="go-execution-progress-copy">
                    <span id="go-execution-progress-label">Review Engine Setup</span>
                    <strong id="go-execution-progress-percent">20%</strong>
                </div>

                <div class="go-execution-progress-track">
                    <span id="go-execution-progress-fill"></span>
                </div>
            </div>

            <main class="go-execution-main">
                <section class="go-execution-stage">
                    <div class="go-execution-step-copy">
                        <p id="go-execution-eyebrow" class="go-execution-eyebrow"></p>
                        <h2 id="go-execution-title"></h2>
                        <p id="go-execution-description" class="go-execution-description"></p>
                    </div>

                    <div id="go-execution-content" class="go-execution-content"></div>

                    <div class="go-execution-footer">
                        <button
                            id="go-execution-back"
                            class="go-execution-secondary-button"
                            type="button"
                        >
                            ← Back
                        </button>

                        <div class="go-execution-footer-right">
                            <span id="go-execution-save-status">Progress saves automatically</span>

                            <button
                                id="go-execution-next"
                                class="go-primary-button go-execution-next-button"
                                type="button"
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                </section>

                <aside class="go-execution-advisor">
                    <div class="go-execution-advisor-head">
                        <span class="go-pulse-dot"></span>
                        <div>
                            <strong>GROWTH OPERATOR'S RECOMMENDATION</strong>
                            <small>I’ll explain the decision as we build.</small>
                        </div>
                    </div>

                    <div id="go-execution-advisor-content"></div>

                    <div class="go-execution-trust">
                        <span>WHY YOU CAN TRUST THIS</span>
                        <ul>
                            <li>37 comparable operators analyzed</li>
                            <li>Current review velocity compared</li>
                            <li>Your 4.9 rating already validated</li>
                            <li>Recommendation confidence: 94%</li>
                        </ul>
                    </div>
                </aside>
            </main>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay
        .querySelectorAll("[data-close-execution]")
        .forEach(function (button) {
            button.addEventListener("click", closeExecution);
        });

    document
        .getElementById("go-execution-back")
        .addEventListener("click", previousExecutionStep);

    document
        .getElementById("go-execution-next")
        .addEventListener("click", nextExecutionStep);

    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            document
                .getElementById("go-execution-overlay")
                ?.classList.contains("open")
        ) {
            closeExecution();
        }
    });
}

function activateExecutionButtons() {
    const directActionButton = document.querySelector(
        ".go-ai-action-cta .go-primary-button"
    );

    if (directActionButton) {
        directActionButton.addEventListener("click", function () {
            if (executionState.completed) {
                openModuleDrawer("Visibility");
                return;
            }

            openExecution();
        });
    }

    const journeyButton = document.querySelector(
        ".go-journey-now .go-primary-button"
    );

    if (journeyButton) {
        journeyButton.addEventListener("click", function (event) {
            if (!executionState.completed) {
                event.preventDefault();
                event.stopImmediatePropagation();
                openExecution();
            }
        });
    }
}

function openExecution() {
    closeModuleDrawer();

    const overlay = document.getElementById("go-execution-overlay");

    if (!overlay) {
        return;
    }

    if (executionState.completed) {
        executionState.currentStep = 4;
    }

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("go-execution-open");

    renderExecutionStep();
}

function closeExecution() {
    const overlay = document.getElementById("go-execution-overlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("go-execution-open");

    saveExecutionState();
    syncExecutionStateToDashboard();
}

function renderExecutionStep() {
    const stepIndex = Math.max(
        0,
        Math.min(executionState.currentStep, executionSteps.length - 1)
    );

    executionState.currentStep = stepIndex;

    const step = executionSteps[stepIndex];
    const percent = Math.round(
        ((stepIndex + 1) / executionSteps.length) * 100
    );

    document.getElementById("go-execution-eyebrow").textContent =
        step.eyebrow;

    document.getElementById("go-execution-title").textContent =
        step.title;

    document.getElementById("go-execution-description").textContent =
        step.description;

    document.getElementById(
        "go-execution-progress-percent"
    ).textContent = `${percent}%`;

    document.getElementById(
        "go-execution-progress-fill"
    ).style.width = `${percent}%`;

    const backButton = document.getElementById("go-execution-back");
    const nextButton = document.getElementById("go-execution-next");

    backButton.disabled = stepIndex === 0;
    backButton.style.visibility = stepIndex === 0 ? "hidden" : "visible";

    if (stepIndex === executionSteps.length - 1) {
        nextButton.textContent = executionState.completed
            ? "Return to Dashboard →"
            : "Activate Review Engine →";
    } else {
        nextButton.textContent = "Continue →";
    }

    step.render();

    saveExecutionState();

    const stage = document.querySelector(".go-execution-stage");

    if (stage) {
        stage.classList.remove("step-enter");

        requestAnimationFrame(function () {
            stage.classList.add("step-enter");
        });
    }
}

function nextExecutionStep() {
    captureExecutionInputs();

    if (executionState.currentStep < executionSteps.length - 1) {
        executionState.currentStep += 1;
        renderExecutionStep();
        return;
    }

    if (!executionState.completed) {
        finishExecution();
        return;
    }

    closeExecution();
}

function previousExecutionStep() {
    captureExecutionInputs();

    if (executionState.currentStep <= 0) {
        return;
    }

    executionState.currentStep -= 1;
    renderExecutionStep();
}

function captureExecutionInputs() {
    const selectedTiming = document.querySelector(
        'input[name="go-review-timing"]:checked'
    );

    if (selectedTiming) {
        executionState.timing = selectedTiming.value;
    }

    const messageInput = document.getElementById(
        "go-review-message-input"
    );

    if (messageInput) {
        executionState.message = messageInput.value.trim();
    }

    const linkInput = document.getElementById(
        "go-review-link-input"
    );

    if (linkInput) {
        executionState.reviewLink = linkInput.value.trim();
    }

    saveExecutionState();
}

function renderExecutionTimingStep() {
    const content = document.getElementById("go-execution-content");
    const advisor = document.getElementById(
        "go-execution-advisor-content"
    );

    const timingOptions = [
        {
            value: "Immediately after the tour",
            title: "Immediately after the tour",
            detail: "Fastest send, but guests may still be gathering belongings."
        },
        {
            value: "30 minutes after the tour",
            title: "30 minutes after the tour",
            detail: "Recommended · The experience is fresh and the guest has settled in."
        },
        {
            value: "2 hours after the tour",
            title: "2 hours after the tour",
            detail: "Useful for longer transfers or post-tour meals."
        },
        {
            value: "The next morning",
            title: "The next morning",
            detail: "Lower urgency, but less likely to interrupt the guest."
        }
    ];

    content.innerHTML = `
        <div class="go-execution-options">
            ${timingOptions
                .map(function (option) {
                    const selected =
                        executionState.timing === option.value;

                    return `
                        <label class="go-execution-option ${
                            selected ? "selected" : ""
                        }">
                            <input
                                type="radio"
                                name="go-review-timing"
                                value="${option.value}"
                                ${selected ? "checked" : ""}
                            >

                            <span class="go-execution-radio"></span>

                            <span class="go-execution-option-copy">
                                <strong>${option.title}</strong>
                                <small>${option.detail}</small>
                            </span>

                            ${
                                option.value === "30 minutes after the tour"
                                    ? '<span class="go-execution-recommended">RECOMMENDED</span>'
                                    : ""
                            }
                        </label>
                    `;
                })
                .join("")}
        </div>
    `;

    content
        .querySelectorAll('input[name="go-review-timing"]')
        .forEach(function (input) {
            input.addEventListener("change", function () {
                executionState.timing = input.value;
                saveExecutionState();

                content
                    .querySelectorAll(".go-execution-option")
                    .forEach(function (option) {
                        option.classList.toggle(
                            "selected",
                            option.contains(input)
                        );
                    });
            });
        });

    advisor.innerHTML = `
        <h3>Use the 30-minute window.</h3>
        <p>
            Guests are usually transitioning home, to their hotel, or to their next activity.
            The experience is still emotionally fresh without the request feeling rushed.
        </p>

        <div class="go-execution-advisor-stat">
            <span>EXPECTED RESULT</span>
            <strong>Higher completion rate</strong>
            <small>with less customer friction</small>
        </div>
    `;
}

function renderExecutionMessageStep() {
    const content = document.getElementById("go-execution-content");
    const advisor = document.getElementById(
        "go-execution-advisor-content"
    );

    content.innerHTML = `
        <div class="go-execution-editor-layout">
            <div class="go-execution-editor">
                <label for="go-review-message-input">
                    TEXT MESSAGE
                </label>

                <textarea
                    id="go-review-message-input"
                    rows="8"
                    maxlength="320"
                >${escapeHtml(executionState.message)}</textarea>

                <div class="go-execution-editor-meta">
                    <span>Personalized with your business name</span>
                    <span id="go-message-character-count">
                        ${executionState.message.length}/320
                    </span>
                </div>
            </div>

            <div class="go-execution-phone">
                <span class="go-execution-phone-label">CUSTOMER PREVIEW</span>

                <div class="go-execution-phone-screen">
                    <div class="go-execution-phone-contact">
                        <span>BR</span>
                        <div>
                            <strong>Blue River Rafting</strong>
                            <small>Text Message</small>
                        </div>
                    </div>

                    <div id="go-review-message-preview" class="go-execution-message-bubble">
                        ${formatPreviewMessage(executionState.message)}
                    </div>

                    <div class="go-execution-review-button">
                        Leave a Google Review
                    </div>
                </div>
            </div>
        </div>
    `;

    const textarea = document.getElementById(
        "go-review-message-input"
    );

    textarea.addEventListener("input", function () {
        executionState.message = textarea.value;
        saveExecutionState();

        document.getElementById(
            "go-review-message-preview"
        ).innerHTML = formatPreviewMessage(textarea.value);

        document.getElementById(
            "go-message-character-count"
        ).textContent = `${textarea.value.length}/320`;
    });

    advisor.innerHTML = `
        <h3>Keep it human and brief.</h3>
        <p>
            The strongest request sounds like it came from the operator—not a marketing platform.
            I removed unnecessary language and kept the favor clear.
        </p>

        <div class="go-execution-advisor-stat">
            <span>MESSAGE QUALITY</span>
            <strong>Strong</strong>
            <small>clear request · low friction · personal tone</small>
        </div>
    `;
}

function renderExecutionLinkStep() {
    const content = document.getElementById("go-execution-content");
    const advisor = document.getElementById(
        "go-execution-advisor-content"
    );

    content.innerHTML = `
        <div class="go-execution-link-card">
            <div class="go-execution-link-icon">G</div>

            <div class="go-execution-link-copy">
                <label for="go-review-link-input">
                    GOOGLE REVIEW LINK
                </label>

                <input
                    id="go-review-link-input"
                    type="url"
                    value="${escapeAttribute(executionState.reviewLink)}"
                    placeholder="https://g.page/r/your-business/review"
                >

                <p>
                    Guests should land directly on the Google review screen—not your homepage
                    or general Business Profile.
                </p>
            </div>

            <span class="go-execution-verified">✓ VERIFIED FORMAT</span>
        </div>

        <div class="go-execution-path">
            <div>
                <span>1</span>
                <strong>Text arrives</strong>
            </div>
            <i>→</i>
            <div>
                <span>2</span>
                <strong>Guest taps once</strong>
            </div>
            <i>→</i>
            <div>
                <span>3</span>
                <strong>Google review opens</strong>
            </div>
        </div>
    `;

    const input = document.getElementById("go-review-link-input");

    input.addEventListener("input", function () {
        executionState.reviewLink = input.value;
        saveExecutionState();
    });

    advisor.innerHTML = `
        <h3>Remove every unnecessary click.</h3>
        <p>
            Sending guests straight to the review composer is one of the simplest ways to
            increase completion without changing the message.
        </p>

        <div class="go-execution-advisor-stat">
            <span>CUSTOMER PATH</span>
            <strong>1 tap</strong>
            <small>from text message to review screen</small>
        </div>
    `;
}

function renderExecutionTestStep() {
    const content = document.getElementById("go-execution-content");
    const advisor = document.getElementById(
        "go-execution-advisor-content"
    );

    content.innerHTML = `
        <div class="go-execution-test">
            <div class="go-execution-test-line"></div>

            <article class="complete">
                <span>✓</span>
                <div>
                    <strong>Tour marked complete</strong>
                    <small>Booking system sends the completion trigger.</small>
                </div>
            </article>

            <article class="complete">
                <span>✓</span>
                <div>
                    <strong>Wait ${escapeHtml(executionState.timing.toLowerCase())}</strong>
                    <small>The timing rule is applied automatically.</small>
                </div>
            </article>

            <article class="complete">
                <span>✓</span>
                <div>
                    <strong>Personalized message sends</strong>
                    <small>Blue River Rafting appears as the sender.</small>
                </div>
            </article>

            <article class="complete">
                <span>✓</span>
                <div>
                    <strong>Review link opens correctly</strong>
                    <small>The guest lands on the Google review screen.</small>
                </div>
            </article>
        </div>

        <div class="go-execution-test-result">
            <span class="go-pulse-dot"></span>
            <div>
                <strong>TEST PASSED</strong>
                <p>The complete customer experience is ready for activation.</p>
            </div>
        </div>
    `;

    advisor.innerHTML = `
        <h3>Everything is working as intended.</h3>
        <p>
            I verified the complete sequence from finished tour to Google review destination.
            No broken steps were detected in this prototype.
        </p>

        <div class="go-execution-advisor-stat positive">
            <span>READINESS</span>
            <strong>100%</strong>
            <small>ready to activate</small>
        </div>
    `;
}

function renderExecutionActivationStep() {
    const content = document.getElementById("go-execution-content");
    const advisor = document.getElementById(
        "go-execution-advisor-content"
    );

    const activatedDate = executionState.activatedAt
        ? new Date(executionState.activatedAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
          })
        : "";

    content.innerHTML = `
        <div class="go-execution-activation ${
            executionState.completed ? "active" : ""
        }">
            <div class="go-execution-activation-icon">
                ${executionState.completed ? "✓" : "⚡"}
            </div>

            <p class="go-execution-activation-kicker">
                ${
                    executionState.completed
                        ? "REVIEW ENGINE ACTIVE"
                        : "READY TO ACTIVATE"
                }
            </p>

            <h3>
                ${
                    executionState.completed
                        ? "Growth Operator is now monitoring the result."
                        : "One click closes the loop."
                }
            </h3>

            <p>
                ${
                    executionState.completed
                        ? `Activated ${activatedDate}. I’ll track review volume, response pace, competitor movement, and future ranking changes.`
                        : "After activation, this workflow will be remembered on the dashboard and the Review Engine stage will be marked complete."
                }
            </p>

            <div class="go-execution-activation-summary">
                <div>
                    <span>SEND TIMING</span>
                    <strong>${escapeHtml(executionState.timing)}</strong>
                </div>

                <div>
                    <span>DESTINATION</span>
                    <strong>Google Reviews</strong>
                </div>

                <div>
                    <span>MONITORING</span>
                    <strong>Reviews + rankings</strong>
                </div>
            </div>
        </div>
    `;

    advisor.innerHTML = `
        <h3>
            ${
                executionState.completed
                    ? "The next job is measurement."
                    : "I would activate this now."
            }
        </h3>

        <p>
            ${
                executionState.completed
                    ? "The setup is finished. Growth Operator should now judge the recommendation by what actually changes."
                    : "Your rating is already strong. Increasing review pace is the fastest remaining reputation opportunity."
            }
        </p>

        <div class="go-execution-advisor-stat positive">
            <span>ESTIMATED ANNUAL IMPACT</span>
            <strong>+$8,700</strong>
            <small>based on current opportunity model</small>
        </div>
    `;
}

function finishExecution() {
    executionState.completed = true;
    executionState.activatedAt =
        executionState.activatedAt || new Date().toISOString();

    saveExecutionState();

    if (!Array.isArray(completedActions.Reputation)) {
        completedActions.Reputation = [];
    }

    completedActions.Reputation = [0, 1, 2];
    saveCompletedActions();

    updateJourneyProgress();
    syncExecutionStateToDashboard();
    updateOperatorExperience();
    renderExecutionStep();

    document.getElementById(
        "go-execution-next"
    ).textContent = "Return to Dashboard →";
}

function syncExecutionStateToDashboard() {
    const actionButton = document.querySelector(
        ".go-ai-action-cta .go-primary-button"
    );

    const actionEyebrow = document.querySelector(
        ".go-ai-action-copy > span"
    );

    const actionTitle = document.querySelector(
        ".go-ai-action-copy > strong"
    );

    const actionDescription = document.querySelector(
        ".go-ai-action-copy > p"
    );

    const actionMeta = document.querySelector(
        ".go-ai-action-cta > small"
    );

    if (!actionButton) {
        return;
    }

    if (executionState.completed) {
        actionButton.textContent = "Open Visibility Plan →";
        actionButton.classList.add("go-execution-complete-button");

        if (actionEyebrow) {
            actionEyebrow.textContent =
                "THE NEXT DECISION I NEED FROM YOU";
        }

        if (actionTitle) {
            actionTitle.textContent =
                "Approve the visibility plan while I continue measuring your Review Engine.";
        }

        if (actionDescription) {
            actionDescription.textContent =
                "The review workflow is running. I found a separate ranking gap we can fix now without interrupting the measurement period.";
        }

        if (actionMeta) {
            actionMeta.textContent =
                "Review Engine stays active · About 20 minutes";
        }

        const scanStatus = document.querySelector(
            ".go-ai-scan-status strong"
        );

        if (scanStatus) {
            scanStatus.textContent = "Priority updated";
        }
    } else {
        actionButton.textContent =
            executionState.currentStep > 0
                ? "Continue setup →"
                : "Let's build it →";

        actionButton.classList.remove(
            "go-execution-complete-button"
        );
    }
}


function activateOperatorExperience() {
    updateOperatorExperience();

    const worklogItems = document.querySelectorAll(".go-operator-worklog-item");

    worklogItems.forEach(function (item, index) {
        item.style.setProperty("--go-worklog-delay", `${index * 90}ms`);
        item.classList.add("go-operator-worklog-reveal");
    });
}

function updateOperatorExperience() {
    const title = document.querySelector(".go-ai-finding-title h2");
    const description = document.querySelector(".go-ai-finding-title > p");
    const voiceMessage = document.getElementById("go-operator-voice-message");
    const label = document.querySelector(".go-ai-finding-label");
    const worklogFinished = document.querySelector(".go-operator-worklog-item.complete strong");
    const worklogWatching = document.querySelector(".go-operator-worklog-item.watching strong");
    const worklogDecision = document.querySelector(".go-operator-worklog-item.decision strong");

    if (executionState.completed) {
        if (label) {
            label.textContent = "I CHANGED THE PRIORITY AFTER NEW DATA ARRIVED";
        }

        if (title) {
            title.textContent =
                "The Review Engine is live. Now I’m moving to the visibility gap it cannot solve alone.";
        }

        if (description) {
            description.textContent =
                "Two new reviews arrived and your rating remains strong. I am keeping that system running while shifting your attention to the next constraint: competitors still appear above you for several high-intent local searches.";
        }

        if (voiceMessage) {
            voiceMessage.textContent =
                "Yesterday, review velocity was the bottleneck. Today, that fix is active. I am not asking you to keep solving the same problem—I am measuring it and moving us to the next one.";
        }
    } else {
        if (worklogFinished) {
            worklogFinished.textContent =
                "I completed the diagnosis and built the recommended workflow.";
        }

        if (worklogWatching) {
            worklogWatching.textContent =
                "I am watching competitor review momentum and local rankings.";
        }

        if (worklogDecision) {
            worklogDecision.textContent =
                "I need your approval to activate the Review Engine.";
        }
    }
}

function formatPreviewMessage(value) {
    return escapeHtml(value)
        .replace(/\{\{review_link\}\}/g, "")
        .replace(/\n/g, "<br>");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}