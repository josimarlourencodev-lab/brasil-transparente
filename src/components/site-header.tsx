"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Drawer, IconButton } from "@mui/material";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: Route;
  label: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Início" },
  { href: "/noticias", label: "Notícias" },
  { href: "/politicos", label: "Políticos" },
  { href: "/podcast", label: "Podcast" },
  { href: "/documentacao", label: "Documentação" },
  { href: "/#sobre", label: "Sobre" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [abertoNa, setAbertoNa] = useState<string | null>(null);
  const aberto = abertoNa !== null && abertoNa === pathname;

  const ativo = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-dark/10 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-neutral-night/85">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-primary dark:text-primary-light">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-sm bg-accent"
          />
          Brasil<span className="text-accent"> Transparente</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                ativo(item.href)
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                  : "text-neutral-dark/70 hover:bg-neutral-dark/5 hover:text-primary dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-primary-light"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="https://github.com/josimarlourencodev-lab/brasil-transparente"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-neutral-dark/15 px-3 py-2 text-sm font-medium text-neutral-dark/70 transition hover:bg-neutral-dark/5 hover:text-primary dark:border-white/15 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-primary-light sm:inline-flex"
            title="Repositório GitHub (abre em nova aba)"
          >
            <GitHubIcon className="h-4 w-4" />
            GitHub
          </a>
          <Link href="/noticias" className="btn-primary hidden sm:inline-flex">
            Acompanhar cobertura
          </Link>
          <IconButton
            aria-label="Abrir menu de navegação"
            onClick={() => setAbertoNa(pathname)}
            className="md:hidden dark:text-neutral-200"
            size="small"
          >
            <MenuIcon />
          </IconButton>
        </div>
      </div>

      <Drawer
        anchor="right"
        open={aberto}
        onClose={() => setAbertoNa(null)}
        slotProps={{ paper: { className: "w-72 p-4" } }}
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-primary">
            Menu
          </span>
          <IconButton aria-label="Fechar menu" onClick={() => setAbertoNa(null)} size="small">
            <CloseIcon />
          </IconButton>
        </div>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Navegação móvel">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAbertoNa(null)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                ativo(item.href)
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                  : "text-neutral-dark/70 hover:bg-neutral-dark/5 hover:text-primary dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-primary-light"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <a
          href="https://github.com/josimarlourencodev-lab/brasil-transparente"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-dark/15 px-4 py-2.5 text-sm font-medium text-neutral-dark/70 transition hover:bg-neutral-dark/5 hover:text-primary dark:border-white/15 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-primary-light"
        >
          <GitHubIcon className="h-4 w-4" />
          Repositório GitHub
        </a>
      </Drawer>
    </header>
  );
}