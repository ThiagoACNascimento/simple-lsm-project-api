import { jsPDF } from "jspdf";
import type { CertificateFullData } from "../query.ts";
import { SERVER_NAME } from "../../../env.ts";

export function generateCertificate(certificate: CertificateFullData) {
  const document = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });
  const width = document.internal.pageSize.getWidth();
  const height = document.internal.pageSize.getHeight();

  document.setFillColor("#000000");
  document.rect(0, 0, width, height, "F");
  document.setDrawColor("#222");
  document.setLineWidth(2);
  document.rect(20, 20, width - 40, height - 40);
  document.rect(30, 30, width - 60, height - 60);

  function center(
    text: string,
    y: number,
    opts: {
      size?: number;
      color?: string;
      style?: "normal" | "bold";
      font?: string;
    },
  ) {
    const {
      size = 16,
      color = "#fff",
      style = "normal",
      font = "times",
    } = opts;

    document.setTextColor(color);
    document.setFont(font, style);
    document.setFontSize(size);
    document.text(text, width / 2, y, { align: "center" });
  }

  center("Certificado de Conclusao", 140, { size: 48, style: "bold" });
  center("certifico que", 200, { size: 48, color: "#bbb" });
  center(certificate.name, 250, { size: 36, style: "bold" });
  center("concluiu o curso", 300, { size: 18, color: "#bbb" });
  center(certificate.title, 345, { size: 28, style: "bold" });
  center(`em ${certificate.completed}`, 385, { size: 16, color: "#bbb" });
  center(`Carga Horaria: ${certificate.hours * 2}h`, 440, {
    size: 24,
  });
  center(`${SERVER_NAME}/api/lms/certificate/${certificate.id}`, 540, {
    size: 16,
    color: "#aaa",
    font: "courrier",
  });

  return Buffer.from(document.output("arraybuffer"));
}
