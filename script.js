"use strict";

const assessmentForm = document.getElementById("assessment-form");

document.addEventListener("DOMContentLoaded", () => {
  const footerYear = document.getElementById("footer-year");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  restoreAssessmentDraft();
  wireSmoothLinks();
});

assessmentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const formData = Object.fromEntries(new FormData(assessmentForm).entries());
  formData.website = normalizeWebsite(formData.website);

  localStorage.setItem("growthOperatorAssessment", JSON.stringify(formData));
  window.location.href = "Pages/scan.html";
});

function validateForm() {
  clearErrors();

  const website = document.getElementById("business-website");
  const businessName = document.getElementById("business-name");
  const ownerName = document.getElementById("owner-name");
  const email = document.getElementById("business-email");

  let valid = true;

  if (!isValidWebsite(website.value)) {
    showError(website, "Enter a complete website address.");
    valid = false;
  }

  if (businessName.value.trim().length < 2) {
    showError(businessName, "Enter your business name.");
    valid = false;
  }

  if (ownerName.value.trim().length < 2) {
    showError(ownerName, "Enter your name.");
    valid = false;
  }

  if (!email.checkValidity()) {
    showError(email, "Enter a valid business email.");
    valid = false;
  }

  if (!valid) {
    document.querySelector(".input-error")?.focus();
  }

  return valid;
}

function isValidWebsite(value) {
  try {
    const normalized = normalizeWebsite(value);
    const url = new URL(normalized);
    return Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

function normalizeWebsite(value) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function showError(input, message) {
  input.classList.add("input-error");
  const error = document.querySelector(`[data-error-for="${input.id}"]`);
  if (error) error.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".input-error").forEach((input) => {
    input.classList.remove("input-error");
  });

  document.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function restoreAssessmentDraft() {
  const saved = localStorage.getItem("growthOperatorAssessment");
  if (!saved) return;

  try {
    const data = JSON.parse(saved);

    Object.entries(data).forEach(([name, value]) => {
      const field = assessmentForm.elements.namedItem(name);
      if (field && typeof value === "string") {
        field.value = value;
      }
    });
  } catch {
    localStorage.removeItem("growthOperatorAssessment");
  }
}

function wireSmoothLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}