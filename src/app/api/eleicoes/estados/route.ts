import { NextResponse } from "next/server";
import { consultarResultadosPorEstado } from "@/lib/tse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const estados = await consultarResultadosPorEstado();
    if (!estados) {
      return NextResponse.json(
        {
          disponivel: false,
          mensagem:
            "A totalização por estado ainda não começou. A divulgação oficial do TSE abre em 04/10/2026 a partir das 17h (horário de Brasília).",
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ disponivel: true, estados });
  } catch {
    return NextResponse.json(
      { disponivel: false, erro: "Falha ao consultar o TSE por estado" },
      { status: 502 }
    );
  }
}