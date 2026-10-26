const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});

const forms = document.querySelectorAll("[data-calculator]");

const sanitizeNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const updateEmi = (form) => {
  const principal = sanitizeNumber(form.principal.value);
  const annualRate = sanitizeNumber(form.rate.value);
  const years = sanitizeNumber(form.years.value);
  const months = years * 12;
  const monthlyRate = annualRate / 12 / 100;

  let emi = 0;
  if (monthlyRate === 0) {
    emi = months === 0 ? 0 : principal / months;
  } else {
    emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }

  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  document.querySelector("[data-output='emi-monthly']").textContent =
    currencyFormatter.format(emi || 0);
  document.querySelector("[data-output='emi-interest']").textContent =
    currencyFormatter.format(totalInterest || 0);
  document.querySelector("[data-output='emi-total']").textContent =
    currencyFormatter.format(totalPayment || 0);
};

const updateCompound = (form) => {
  const principal = sanitizeNumber(form.principal.value);
  const annualRate = sanitizeNumber(form.rate.value) / 100;
  const years = sanitizeNumber(form.years.value);
  const frequency = Math.max(1, sanitizeNumber(form.frequency.value));

  const futureValue =
    principal * Math.pow(1 + annualRate / frequency, frequency * years);
  const interestEarned = futureValue - principal;

  document.querySelector("[data-output='compound-future']").textContent =
    currencyFormatter.format(futureValue || 0);
  document.querySelector("[data-output='compound-interest']").textContent =
    currencyFormatter.format(interestEarned || 0);
};

const updateBreakEven = (form) => {
  const fixed = sanitizeNumber(form.fixed.value);
  const price = sanitizeNumber(form.price.value);
  const variable = sanitizeNumber(form.variable.value);
  const contribution = price - variable;

  const units = contribution <= 0 ? 0 : fixed / contribution;
  const revenue = units * price;

  document.querySelector("[data-output='breakeven-units']").textContent =
    units ? units.toFixed(1) : "0";
  document.querySelector("[data-output='breakeven-revenue']").textContent =
    currencyFormatter.format(revenue || 0);
};

const updateRoi = (form) => {
  const cost = sanitizeNumber(form.cost.value);
  const netReturn = sanitizeNumber(form.return.value);
  const profit = netReturn - cost;
  const roi = cost === 0 ? 0 : profit / cost;

  document.querySelector("[data-output='roi-percent']").textContent =
    percentFormatter.format(roi || 0);
  document.querySelector("[data-output='roi-profit']").textContent =
    currencyFormatter.format(profit || 0);
};

const updateNpv = (form) => {
  const investment = sanitizeNumber(form.investment.value);
  const rate = sanitizeNumber(form.rate.value) / 100;
  const cashFlows = [
    sanitizeNumber(form.year1.value),
    sanitizeNumber(form.year2.value),
    sanitizeNumber(form.year3.value),
  ];

  const npv =
    cashFlows.reduce(
      (total, cash, index) => total + cash / Math.pow(1 + rate, index + 1),
      0,
    ) - investment;

  document.querySelector("[data-output='npv-value']").textContent =
    currencyFormatter.format(npv || 0);
  document.querySelector("[data-output='npv-decision']").textContent =
    npv >= 0 ? "Accept (value creating)" : "Reject (value destroying)";
};

const calculators = {
  emi: updateEmi,
  compound: updateCompound,
  breakeven: updateBreakEven,
  roi: updateRoi,
  npv: updateNpv,
};

const updateAll = () => {
  forms.forEach((form) => {
    const key = form.dataset.calculator;
    calculators[key]?.(form);
  });
};

forms.forEach((form) => {
  form.addEventListener("input", () => {
    const key = form.dataset.calculator;
    calculators[key]?.(form);
  });
});

updateAll();
