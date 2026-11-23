import { Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export function SecurityFeatureIndex() {
  const tools = [
    {
      title: 'Password Analyzer',
      badge: 'Z-SCORE // 4.2',
      to: '/analyzer',
      desc: 'Heuristic entropy modeling & multi-scenario crack resistance simulation',
      icon: ShieldCheck,
      color: 'text-accent',
      accentBg: 'bg-accent/10 border-accent/30',
      borderHover: 'hover:border-accent hover:shadow-[0_0_16px_rgba(245,158,11,0.2)]',
    },
    {
      title: 'Secure Generator',
      badge: 'CSPRNG // UNBIASED',
      to: '/generator',
      desc: 'Cryptographic rejection sampling generating uniform 128-bit keys',
      icon: KeyRound,
      color: 'text-status-success',
      accentBg: 'bg-status-success/10 border-status-success/30',
      borderHover: 'hover:border-status-success hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]',
    },
    {
      title: 'Breach Checker',
      badge: 'k-ANONYMITY // HIBP',
      to: '/breach-checker',
      desc: 'Zero-knowledge 5-hex SHA-1 range queries against known global leaks',
      icon: AlertTriangle,
      color: 'text-status-danger',
      accentBg: 'bg-status-danger/10 border-status-danger/30',
      borderHover: 'hover:border-status-danger hover:shadow-[0_0_16px_rgba(239,68,68,0.2)]',
    },
  ];

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between pb-1 border-b border-border/80">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary font-mono flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Core Security Modules</span>
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-enclave-plate border border-border-strong text-foreground-dim uppercase">
          Enclave // Direct
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.to}
              to={tool.to}
              className={`p-4 rounded-xl bg-enclave-plate border border-border-strong ${tool.borderHover} transition-all duration-200 flex flex-col justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-card-tactical`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-lg border ${tool.accentBg} shrink-0 transition-transform group-hover:scale-110`}>
                    <Icon className={`w-4 h-4 ${tool.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors font-sans truncate">
                        {tool.title}
                      </h3>
                    </div>
                    <span className="font-mono text-[9px] text-foreground-dim block tracking-wider uppercase">
                      {tool.badge}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-foreground-dim px-1.5 py-0.5 rounded bg-enclave-void border border-border/60">
                  0{idx + 1}
                </span>
              </div>

              <p className="text-xs text-foreground-secondary leading-relaxed font-sans line-clamp-2">
                {tool.desc}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] font-mono text-accent">
                <span className="group-hover:underline">Launch Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default SecurityFeatureIndex;

