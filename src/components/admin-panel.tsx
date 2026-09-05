"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

type AdminNoticia = {
  id: number;
  titulo: string;
  categoria: string;
  tipo_fonte: string;
  status: string;
  publicado_em: string | null;
  contradicao_detectada: boolean;
  imagem_url: string | null;
};

const STATUS = ["rascunho", "revisao", "publicado", "rejeitado"];

const FORM_INICIAL = {
  titulo: "",
  url: "",
  resumo: "",
  categoria: "",
  imagem_url: "",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1E6FB8" },
    secondary: { main: "#E53935" },
    background: { default: "#121212", paper: "#1E1E1E" },
  },
});

const STATUS_COLOR: Record<string, "success" | "warning" | "default" | "error"> = {
  publicado: "success",
  revisao: "warning",
  rascunho: "default",
  rejeitado: "error",
};

export function AdminPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [noticias, setNoticias] = useState<AdminNoticia[]>([]);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    const qs = status ? `?status=${status}` : "";

    (async () => {
      try {
        const res = await fetch(`/api/admin/noticias${qs}`);
        if (res.status === 401) {
          await fetch("/api/admin/logout", { method: "POST" });
          router.refresh();
          return;
        }
        if (!res.ok) {
          if (ativo) setErro("Falha ao carregar matérias.");
          return;
        }
        if (ativo) setNoticias(await res.json());
      } catch {
        if (ativo) setErro("Erro ao carregar.");
      }
    })();

    return () => {
      ativo = false;
    };
  }, [status, router]);

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/noticias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          url: form.url,
          resumo: form.resumo,
          categoria: form.categoria,
          imagem_url: form.imagem_url,
        }),
      });
      if (res.status === 401) {
        await fetch("/api/admin/logout", { method: "POST" });
        router.refresh();
        return;
      }
      const payload = await res.json();
      if (!res.ok) {
        setErro(typeof payload?.error === "string" ? payload.error : "Não foi possível adicionar a matéria.");
        return;
      }
      setForm(FORM_INICIAL);
      setNoticias((prev) => [payload, ...prev]);
    } catch {
      setErro("Erro ao salvar a matéria.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(n: AdminNoticia) {
    if (!window.confirm(`Remover a matéria "${n.titulo}"?`)) return;
    setErro("");
    try {
      const res = await fetch(`/api/admin/noticias?id=${n.id}`, { method: "DELETE" });
      if (res.status === 401) {
        await fetch("/api/admin/logout", { method: "POST" });
        router.refresh();
        return;
      }
      if (!res.ok) {
        setErro("Falha ao remover a matéria.");
        return;
      }
      setNoticias((prev) => prev.filter((x) => x.id !== n.id));
    } catch {
      setErro("Erro ao remover a matéria.");
    }
  }

  const columns = useMemo<GridColDef<AdminNoticia>[]>(
    () => [
      {
        field: "titulo",
        headerName: "Título",
        flex: 2,
        minWidth: 260,
      },
      { field: "categoria", headerName: "Categoria", width: 140 },
      { field: "tipo_fonte", headerName: "Fonte", width: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            color={STATUS_COLOR[params.value as string] ?? "default"}
            variant="outlined"
          />
        ),
      },
      {
        field: "publicado_em",
        headerName: "Publicado",
        width: 120,
        valueGetter: (value: string | null) =>
          value ? new Date(value).toLocaleDateString("pt-BR") : "—",
      },
      {
        field: "contradicao_detectada",
        headerName: "Contradição",
        width: 120,
        valueGetter: (value: boolean) => (value ? "sim" : "não"),
      },
      {
        field: "acoes",
        headerName: "",
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            color="error"
            onClick={() => remover(params.row)}
          >
            Remover
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 4, pb: 10 }}>
        <Stack
          sx={{
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
          }}
        >
          <Typography variant="h5" component="h1" color="text.primary">
            Painel do Administrador / Auditor
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              router.refresh();
            }}
          >
            Sair
          </Button>
        </Stack>

        <Stack
          direction="row"
          sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}
        >
          <Button
            size="small"
            variant={status === "" ? "contained" : "text"}
            onClick={() => setStatus("")}
          >
            todas
          </Button>
          {STATUS.map((s) => (
            <Button
              key={s}
              size="small"
              variant={status === s ? "contained" : "text"}
              onClick={() => setStatus(s)}
            >
              {s}
            </Button>
          ))}
        </Stack>

        {erro ? <Typography color="error" sx={{ fontSize: "0.875rem", mb: 2 }}>{erro}</Typography> : null}

        <Paper
          component="form"
          onSubmit={adicionar}
          sx={{ p: 2.5, mb: 3 }}
          elevation={0}
          variant="outlined"
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Adicionar matéria
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                label="Título"
                required
                size="small"
                fullWidth
              />
              <TextField
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                label="URL (http:// ou https://)"
                required
                type="url"
                size="small"
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                value={form.resumo}
                onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                label="Resumo (opcional)"
                size="small"
                fullWidth
              />
              <TextField
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                label="Categoria (padrão: Outros)"
                size="small"
                fullWidth
              />
              <TextField
                value={form.imagem_url}
                onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                label="URL da imagem (opcional)"
                type="url"
                size="small"
                fullWidth
              />
            </Stack>
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={salvando}
              >
                {salvando ? "Salvando…" : "Adicionar matéria"}
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={0} variant="outlined" sx={{ height: 520, width: "100%" }}>
          <DataGrid
            rows={noticias}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 20 } },
            }}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            getRowHeight={() => "auto"}
            localeText={{ noRowsLabel: "Nenhuma matéria encontrada." }}
          />
        </Paper>
      </Box>
    </ThemeProvider>
  );
}