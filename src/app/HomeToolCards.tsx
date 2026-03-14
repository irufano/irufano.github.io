"use client";

import ToolCard from "@/components/Home/ToolCard";

export default function HomeToolCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <ToolCard
        title="AES Encryption"
        subTitle="Encrypt and decrypt text"
        icon="shield"
        onClicked={() => alert("Coming soon")}
      />
      <ToolCard
        title="Roulette"
        subTitle="Digital spinner tool"
        icon="target"
        onClicked={() => alert("Coming soon")}
      />
      <ToolCard
        title="Calendar"
        subTitle="Holiday event viewer"
        icon="calendar"
        onClicked={() => alert("Coming soon")}
      />
      <ToolCard
        title="See more tools"
        subTitle="→"
        icon="box"
        bg="bg-teal-100 dark:bg-teal-900"
        hover="hover:bg-primary/50 hover:dark:bg-teal-950"
        onClicked={() => alert("Coming soon")}
      />
    </div>
  );
}
