export type SalaryConfig = {
  basicRatio?: number;
  hraRatio?: number;
  conveyance?: number;
  pfPercent?: number;
  pt?: number;
  esicRate?: number;
  // optional: force employee PF (and employer PF) to a fixed value
  fixedEmployeePf?: number;
};

export function computeSalaryFromCTC(ctcPm: number, cfg?: SalaryConfig) {
  const conveyanceFixed = cfg?.conveyance ?? 1600;
  const ptFixed = cfg?.pt ?? 200;
  const esicRate = cfg?.esicRate ?? 0; // assume 0 by default
  const pfPercent = cfg?.pfPercent ?? 0.12; // 12% on basic
  const basicRatioCfg = cfg?.basicRatio ?? 0.5;
  const hraRatioCfg = cfg?.hraRatio ?? 0.4;

  // iterative approach because employer PF depends on basic which depends on actual gross which depends on employer PF
  let employerPf = 0;
  let actualGross = 0;
  let basic = 0;

  for (let i = 0; i < 10; i++) {
    actualGross = Math.round(ctcPm - employerPf - Math.round(actualGross * esicRate));
    basic = Math.round(actualGross * basicRatioCfg);
    let newEmployerPf = Math.round(basic * pfPercent);
    // if fixedEmployeePf provided, use that for employerPf as per requirement
    if (cfg?.fixedEmployeePf != null) {
      newEmployerPf = Math.round(cfg.fixedEmployeePf);
    }
    if (Math.abs(newEmployerPf - employerPf) <= 1) {
      employerPf = newEmployerPf;
      break;
    }
    employerPf = newEmployerPf;
  }

  // final calculations matching the sheet formulas
  actualGross = Math.round(ctcPm - employerPf - Math.round(actualGross * esicRate));
  basic = Math.round(actualGross * basicRatioCfg);
  const hra = Math.round(basic * (cfg?.hraRatio ?? hraRatioCfg));
  const conveyance = conveyanceFixed;
  const splAllowance = Math.round(actualGross - basic - hra - conveyance);

  const employerEsic = Math.round(actualGross * esicRate);
  let employeePf = Math.round(basic * pfPercent);
  const employeeEsic = Math.round(actualGross * esicRate);

  if (cfg?.fixedEmployeePf != null) {
    employeePf = Math.round(cfg.fixedEmployeePf);
    // keep employerPf in sync with fixed value as well
    employerPf = Math.round(cfg.fixedEmployeePf);
  }

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
