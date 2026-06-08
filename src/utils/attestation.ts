function fmtPrime(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M FCFA`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}k FCFA`;
  return `${val.toLocaleString("fr-FR")} FCFA`;
}

function fmtDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

export function printAttestation(p: any) {
  const nom    = p.assure ? `${p.assure.nom} ${p.assure.prenom}` : "—";
  const numero = p.numero || "—";
  const type   = p.type   || "—";
  const prime  = p.montantPrime != null ? fmtPrime(Number(p.montantPrime)) : "—";
  const statut = (p.statut || "ACTIVE");
  const couv   = p.couverture || "—";
  const debut  = fmtDate(p.dateDebut || p.createdAt);
  const fin    = fmtDate(p.dateFin);
  const today  = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const origin = window.location.origin;

  const win = window.open("", "", "width=860,height=900");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Attestation ${numero}</title>
    <meta charset="utf-8"/>
    <style>
      @page { margin: 0; size: A4; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
      .page { width: 210mm; min-height: 297mm; padding: 20mm 18mm; }
      .header { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 3px solid #2563eb; margin-bottom: 24px; }
      .header img { width: 60px; height: 60px; object-fit: contain; }
      .header-text h1 { font-size: 22pt; font-weight: 900; color: #2563eb; }
      .header-text p { font-size: 9pt; color: #64748b; margin-top: 2px; }
      .title-block { text-align: center; margin: 24px 0; }
      .title-block h2 { font-size: 17pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1e293b; }
      .title-block .sub { font-size: 9pt; color: #64748b; margin-top: 6px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 24px 0; }
      .info-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
      .info-box.blue { border-left: 4px solid #2563eb; background: #eff6ff; }
      .info-box .label { font-size: 7pt; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
      .info-box .value { font-size: 11pt; font-weight: 700; color: #1e293b; }
      .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 9pt; font-weight: 700; background: ${statut === "ACTIVE" ? "#dcfce7" : "#fee2e2"}; color: ${statut === "ACTIVE" ? "#166534" : "#991b1b"}; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8; }
      .sign-block { text-align: right; }
      .sign-line { border-top: 2px solid #2563eb; width: 160px; margin: 40px 0 6px auto; }
      .sign-label { font-size: 8pt; color: #64748b; text-align: right; }
    </style>
  </head><body><div class="page">
    <div class="header">
      <img src="${origin}/logo.png" alt="Logo" onerror="this.style.display='none'" />
      <div class="header-text">
        <h1>Papy Services Assurances</h1>
        <p>République du Sénégal — Assurance Santé Digitale</p>
      </div>
    </div>
    <div class="title-block">
      <h2>Attestation d'Assurance</h2>
      <p class="sub">Délivrée le ${today}</p>
    </div>
    <div class="info-grid">
      <div class="info-box blue">
        <div class="label">Assuré(e)</div>
        <div class="value">${nom}</div>
      </div>
      <div class="info-box blue">
        <div class="label">N° Police</div>
        <div class="value">${numero}</div>
      </div>
      <div class="info-box">
        <div class="label">Type de couverture</div>
        <div class="value">${type}</div>
      </div>
      <div class="info-box">
        <div class="label">Prime mensuelle</div>
        <div class="value">${prime}</div>
      </div>
      <div class="info-box">
        <div class="label">Couverture</div>
        <div class="value">${couv}</div>
      </div>
      <div class="info-box">
        <div class="label">Statut</div>
        <div class="value"><span class="status-badge">${statut}</span></div>
      </div>
      <div class="info-box">
        <div class="label">Date de début</div>
        <div class="value">${debut}</div>
      </div>
      <div class="info-box">
        <div class="label">Date de fin</div>
        <div class="value">${fin}</div>
      </div>
    </div>
    <p style="font-size:9pt;color:#475569;line-height:1.6;margin-top:12px;">
      La présente attestation certifie que la personne désignée ci-dessus est couverte par une police d'assurance
      santé délivrée par <strong>Papy Services Assurances</strong>, conformément aux dispositions du Code CIMA
      et des réglementations de l'IPM/CNSS en vigueur au Sénégal.
    </p>
    <div class="sign-block">
      <div class="sign-line"></div>
      <div class="sign-label">Signature et cachet — Papy Services Assurances</div>
    </div>
    <div class="footer">
      <span>Papy Services Assurances · Tél : +221 33 123 45 67 · Dakar, Sénégal</span>
      <span>Document généré le ${today}</span>
    </div>
  </div></body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}
