import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { subscribeNewsletter } from "@/lib/api";
import { Button } from "@/components/ui/button";

/**
 * Inscrição na newsletter (home e página da newsletter). Sem onComplete, leva à confirmação em
 * /newsletter?confirmed=true. O consentimento é obrigatório.
 */
export function NewsletterForm({ onComplete }: { onComplete?: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await subscribeNewsletter(email.trim());
      if (onComplete) onComplete();
      else await navigate({ to: "/newsletter", search: { confirmed: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto mt-8 max-w-md">
      <form
        id="pack-newsletter"
        onSubmit={submit}
        className="flex border border-border bg-background"
      >
        <input
          aria-label="E-mail da newsletter"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm outline-none"
        />
        <Button type="submit" className="h-auto px-6" disabled={busy}>
          {busy ? "ENVIANDO..." : "ENTRAR"}
          <ArrowRight />
        </Button>
      </form>
      <label className="mt-4 flex items-start gap-2 text-left text-xs text-muted-foreground">
        <input type="checkbox" form="pack-newsletter" required />
        <span>Aceito receber novidades e concordo com a política de privacidade.</span>
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
