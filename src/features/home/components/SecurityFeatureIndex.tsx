import { Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';

export function SecurityFeatureIndex() {
  const tools = [
    {
      title: 'Password Analyzer',
      to: '/analyzer',
      desc: 'Heuristic entropy & attack scenario models',
      icon: ShieldCheck,
      color: 'text-accent',
      borderHover: 'hover:border-accent/50',
    },
    {
      title: 'Secure Generator',
      to: '/generator',
      desc: 'Cryptographic CSPRNG uniform random keys',
      icon: KeyRound,
      color: 'text-emerald-500',
      borderHover: 'hover:border-emerald-500/50',
    },
    {
      title: 'Breach Checker',
      to: '/breach-checker',
      desc: 'k-Anonymity privacy-preserving leak lookup',
      icon: AlertTriangle,
      color: 'text-rose-400',
      borderHover: 'hover:border-rose-400/50',
    },
  ];

  return (
    <div className="space-y-2.5 text-left">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
          Security Utilities
        </h2>
        <span className="text-[10px] font-mono text-muted-dim">Direct Access</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.to}
              to={tool.to}
              className={`p-3 rounded-xl bg-surface border border-border ${tool.borderHover} transition-all duration-150 flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-surface-elevated border border-border shrink-0 group-hover:border-accent/40 transition-colors">
                  <Icon className={`w-4 h-4 ${tool.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-foreground group-hover:text-accent transition-colors font-sans truncate">
                    {tool.title}
                  </h3>
                  <p className="text-[11px] text-muted truncate font-sans">
                    {tool.desc}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent shrink-0 transform group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
