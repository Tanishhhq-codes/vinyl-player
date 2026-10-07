import { Component, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SceneStatus({ failed = false, onRetry }: { failed?: boolean; onRetry?: () => void }) {
  return <div className="scene-status" role={failed ? "alert" : "status"}>
    <span className="font-display text-3xl">{failed ? "The room couldn’t load" : "Opening the listening room…"}</span>
    {failed && <><p>Your browser couldn’t display the 3D room.</p><Button variant="outline" onClick={onRetry ?? (() => window.location.reload())}><RotateCcw size={16} /> Try again</Button></>}
  </div>;
}

export class SceneRecovery extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: Error) { console.error("Listening room failed to render:", error); }
  override render() { return this.state.failed ? <SceneStatus failed onRetry={this.props.onRetry} /> : this.props.children; }
}