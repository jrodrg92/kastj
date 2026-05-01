import toast from "react-hot-toast";
import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";

type Props = {
  title: string;
  description: string;
  recipient: string;
  goal: string;
  duration: string;
  loading: boolean;
  connected: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRecipientChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onCreate: () => Promise<void>;
};

const durationOptions = [
  { label: "30 seg", value: "300" },
  { label: "1 hora", value: "3600" },
  { label: "1 día", value: "86400" },
  { label: "7 días", value: "604800" },
  { label: "30 dias", value: "2592000" },
];

export function CreateProposalForm({
  title,
  description,
  recipient,
  goal,
  duration,
  loading,
  connected,
  onTitleChange,
  onDescriptionChange,
  onRecipientChange,
  onGoalChange,
  onDurationChange,
  onCreate,
}: Props) {
  async function handleSubmit() {
    if (!connected) {
      toast.error("Conecta tu wallet primero");
      return;
    }

    await onCreate();
  }

  const { t } = useLanguage();

  return (
    <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t.createProposal}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Define los datos públicos y las condiciones de financiación.
          </p>
        </div>

        <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
          {NETWORK.name}
        </span>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-zinc-300">
            {t.title}
          </label>
          <input
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
            placeholder="Ej: Financiar herramienta comunitaria"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-zinc-300">
            {t.description}
          </label>
          <textarea
            className="min-h-28 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
            placeholder="Explica qué se quiere financiar, por qué importa y cómo se usará el dinero."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-zinc-300">
            {t.walletreceivers}
          </label>
          <input
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => onRecipientChange(e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              {t.objetive} ({NETWORK.currency})
            </label>
            <input
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
              placeholder={`Ej: 10 ${NETWORK.currency}`}
              value={goal}
              onChange={(e) => onGoalChange(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              {t.timer}
            </label>
            <select
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
              value={duration}
              onChange={(e) => onDurationChange(e.target.value)}
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
          {t.exitDiv}
        </div>

        <button
          disabled={!connected || loading}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-green-500 px-5 py-3 font-bold text-black transition hover:bg-green-400 disabled:opacity-40 md:w-auto"
        >
          {loading ? "Creando..." : t.createProposal}
        </button>
      </div>
    </section>
  );
}