export function computeSalaryFromCTC(ctcPm: number) {
  const conveyanceFixed = 1600;
  const ptFixed = 200;
  const esicRate = 0; // assume 0 by default
  const pfPercent = 0.12; // 12% on basic

  // iterative approach because employer PF depends on basic which depends on actual gross which depends on employer PF
  let employerPf = 0;
  let actualGross = 0;
  let basic = 0;

  for (let i = 0; i < 10; i++) {
    actualGross = Math.round(ctcPm - employerPf - Math.round(actualGross * esicRate));
    basic = Math.round(actualGross * 0.5);
    const newEmployerPf = Math.round(basic * pfPercent);
    if (Math.abs(newEmployerPf - employerPf) <= 1) {
      employerPf = newEmployerPf;
      break;
    }
    employerPf = newEmployerPf;
  }

  // final calculations matching the sheet formulas
  actualGross = Math.round(ctcPm - employerPf - Math.round(actualGross * esicRate));
  basic = Math.round(actualGross * 0.5);
  const hra = Math.round(basic * 0.4); // B8 = B7 * 0.4
  const conveyance = conveyanceFixed;
  const splAllowance = Math.round(actualGross - basic - hra - conveyance);

  const employerEsic = Math.round(actualGross * esicRate);
  const employeePf = Math.round(basic * pfPercent);
  const employeeEsic = Math.round(actualGross * esicRate);

  const grossPayable = basic + hra + conveyance + splAllowance; // equals actualGross
  const netPayable = Math.round(grossPayable - (employeePf + employeeEsic + ptFixed));

  return {
    employerPf,
    employerEsic,
    actualGross,
    basicPay: basic,
    hra,
    conveyance,
    splAllowance,
    grossPayable,
    employeePf,
    employeeEsic,
    pt: ptFixed,
    netPayable,
  } as const;
}
