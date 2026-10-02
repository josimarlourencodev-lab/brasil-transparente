import { NextResponse } from "next/server";
import { consultarResultadoPresidencial } from "@/lib/tse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resultado = await consultarResultadoPresidencial();
    if (!resultado) {
      return NextResponse.json(
        {
          disponivel: false,
          mensagem:
            "A totalização presidencial das Eleições 2026 ainda não começou. A divulgação oficial do TSE abre em 04/10/2026 a partir das 17h (horário de Brasília).",
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ disponivel: true, resultado });
  } catch {
    return NextResponse.json(
      { disponivel: false, erro: "Falha ao consultar o TSE" },
      { status: 502 }
    );
  }
}