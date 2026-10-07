import { createFileRoute } from "@tanstack/react-router";
import { VinylExperience } from "@/components/VinylExperience";
import { SceneStatus } from "@/components/SceneRecovery";

export const Route = createFileRoute("/")({
  ssr: false,
  pendingComponent: SceneStatus,
  head: () => ({
    meta: [
      { title: "Vinyl — A Living Listening Room" },
      { name: "description", content: "An interactive vinyl listening-room experience that brings your current track to life." },
      { property: "og:title", content: "Vinyl — A Living Listening Room" },
      { property: "og:description", content: "An interactive vinyl listening-room experience that brings your current track to life." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <VinylExperience />;
}
