const growthModules = {
    Visibility: {
        score: "63%",
        status: "Needs Attention",
        confidence: 91,
        difficulty: "Easy",
        timeRequired: "2–3 hours",
        successLikelihood: "Very High",
        headline: "More high-intent customers should be finding your business.",
        explanation:
            "Your website has a solid foundation, but nearby competitors currently appear more often for important local searches.",
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
        headline: "Your reputation is one of your strongest growth assets.",
        explanation:
            "Your rating and recent review momentum build trust, but competitors are continuing to add reviews every week.",
        impactLabel: "Reviews gained this month",
        impact: "+12",
        actions: [
            {
                title: "Automate post-tour review requests",
                description:
                    "Send review requests by text shortly after each completed experience.",
                time: "30 minutes",
                impact: "+18 reviews/month"
            },
            {
                title: "Track competitor review velocity",
                description:
                    "Compare weekly review growth against nearby operators.",
                time: "15 minutes",
                impact: "Protect local ranking"
            },
            {
                title: "Add reviews to key booking pages",
                description:
                    "Feature high-quality customer feedback beside major booking calls-to-action.",
                time: "30 minutes",
                impact: "+2–4% conversion"
            }
        ]
    },

    Website: {
        score: "71%",
        status: "Needs Attention",
        confidence: 88,
        difficulty: "Moderate",
        timeRequired: "3–5 hours",
        successLikelihood: "High",
        headline: "Your website is clear, but mobile visitors experience friction.",
        explanation:
            "Most visitors arrive from a phone. Improvements to speed, clarity, and booking calls-to-action could increase conversion.",
        impactLabel: "Estimated annual opportunity",
        impact: "+$8,700",
        actions: [
            {
                title: "Strengthen the mobile call-to-action",
                description:
                    "Keep a clear booking button visible throughout the mobile experience.",
                time: "30 minutes",
                impact: "+$2,100/year"
            },
            {
                title: "Simplify the path to checkout",
                description:
                    "Remove unnecessary steps between the tour page and booking flow.",
                time: "1–2 hours",
                impact: "+$3,800/year"
            },
            {
                title: "Improve mobile page speed",
                description:
                    "Compress large images and reduce unnecessary scripts.",
                time: "2 hours",
                impact: "+$2,800/year"
            }
        ]
    },

    Conversion: {
        score: "58%",
        status: "Priority",
        confidence: 93,
        difficulty: "Moderate",
        timeRequired: "4–6 hours",
        successLikelihood: "Very High",
        headline: "Mobile booking conversion is your largest immediate opportunity.",
        explanation:
            "Mobile visitors account for most traffic but complete reservations less often than desktop visitors.",
        impactLabel: "Estimated annual opportunity",
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
            "You track most important channels, but several customer acquisition and competitor signals remain disconnected.",
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
    activateHealthCards();
    activateNavigation();
    activateAdvisorButton();
    activateJourneyButton();
    updateJourneyProgress();
    animateDashboard();
});

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
                    <h2 id="go-drawer-title">Visibility</h2>
                    <p id="go-drawer-headline"></p>
                </div>

                <div class="go-drawer-score">
                    <strong id="go-drawer-score">63%</strong>
                    <span id="go-drawer-status">Needs Attention</span>
                </div>
            </div>

            <div class="go-ai-summary-grid">
                <div class="go-ai-summary-card">
                    <span>AI CONFIDENCE</span>
                    <strong id="go-confidence-value">91%</strong>

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
                    <strong id="go-time-value">2–3 hours</strong>
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
        card.setAttribute(
            "aria-label",
            `Open ${moduleName} analysis`
        );

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

function activateAdvisorButton() {
    const advisorButton = document.querySelector(
        ".go-advisor-card .go-primary-button"
    );

    if (!advisorButton) {
        return;
    }

    advisorButton.addEventListener("click", function () {
        openModuleDrawer("Conversion");
    });
}

function activateJourneyButton() {
    const journeyButton = document.querySelector(
        ".go-journey-now .go-primary-button"
    );

    if (!journeyButton) {
        return;
    }

    journeyButton.addEventListener("click", function () {
        openModuleDrawer("Conversion");
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
    const conversionCompleted =
        completedActions.Conversion || [];

    const completedCount = conversionCompleted.length;
    const totalActions =
        growthModules.Conversion.actions.length;

    const conversionPercent = Math.round(
        (completedCount / totalActions) * 100
    );

    const baseJourneyPercent = 42;
    const addedJourneyPercent = Math.round(
        conversionPercent * 0.16
    );

    const journeyPercent = Math.min(
        58,
        baseJourneyPercent + addedJourneyPercent
    );

    const journeyDay = Math.min(
        52,
        38 + Math.round(completedCount * 4.5)
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
                "Website Improvements Complete";
        }

        if (currentStageDescription) {
            currentStageDescription.textContent =
                "Your mobile conversion action plan is complete. Growth Operator is ready to remeasure results and move you into the next growth stage.";
        }

        if (nextStepTitle) {
            nextStepTitle.textContent =
                "Unlock the Review Engine.";
        }

        if (nextStepDescription) {
            nextStepDescription.textContent =
                "Growth Operator will now shift focus toward review velocity, reputation growth, and stronger customer follow-up.";
        }

        if (journeyButton) {
            journeyButton.textContent =
                "Open Review Engine →";

            journeyButton.onclick = function () {
                openModuleDrawer("Reputation");
            };
        }

        updateJourneyStepThree(true);
        updateJourneyStepFour(true);
    } else {
        if (currentStageTitle) {
            currentStageTitle.textContent =
                "Website Improvements";
        }

        if (currentStageDescription) {
            currentStageDescription.textContent =
                "Your foundation is complete. The next phase focuses on improving the customer experience and increasing booking conversion.";
        }

        if (nextStepTitle) {
            nextStepTitle.textContent =
                "Complete your mobile conversion improvements.";
        }

        if (nextStepDescription) {
            nextStepDescription.textContent =
                "Finish the three recommended fixes, then Growth Operator will remeasure your score and unlock the Review Engine stage.";
        }

        if (journeyButton) {
            journeyButton.textContent =
                completedCount > 0
                    ? "Continue My Plan →"
                    : "Start My Plan →";

            journeyButton.onclick = function () {
                openModuleDrawer("Conversion");
            };
        }

        updateJourneyStepThree(false);
        updateJourneyStepFour(false);
    }
}

function updateJourneyStepThree(isComplete) {
    const steps = document.querySelectorAll(
        ".go-journey-step"
    );

    const websiteStep = steps[2];

    if (!websiteStep) {
        return;
    }

    const marker = websiteStep.querySelector(
        ".go-step-marker"
    );

    const status = websiteStep.querySelector("small");

    if (isComplete) {
        websiteStep.classList.remove("current");
        websiteStep.classList.add("complete");

        if (marker) {
            marker.textContent = "✓";
        }

        if (status) {
            status.textContent = "Complete";
        }
    } else {
        websiteStep.classList.remove("complete");
        websiteStep.classList.add("current");

        if (marker) {
            marker.textContent = "3";
        }

        if (status) {
            status.textContent = "In Progress";
        }
    }
}

function updateJourneyStepFour(isCurrent) {
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

    if (isCurrent) {
        reviewStep.classList.add("current");

        if (marker) {
            marker.textContent = "4";
        }

        if (status) {
            status.textContent = "Ready";
        }
    } else {
        reviewStep.classList.remove("current");

        if (marker) {
            marker.textContent = "4";
        }

        if (status) {
            status.textContent = "Up Next";
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
        ".go-advisor-card, .go-score-card, .go-revenue-card, .go-health-card, .go-journey-card, .go-feed-card"
    );

    animatedElements.forEach(function (element, index) {
        element.style.setProperty(
            "--go-animation-delay",
            `${index * 55}ms`
        );

        element.classList.add("go-reveal");
    });
}