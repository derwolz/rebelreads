// Updated reader panels with video URLs
const readerPanels = [
  {
    title: "Your taste, unbound",
    description:
      "Experience a new way to explore stories that resonate with you. No algorithm limiting your choices, just authentic connections.",
    videoUrl: "/videos/reader-video-1.mp4", // First video
    image: {
      src: "/images/reader-explore.svg",
      alt: "Reader exploring books",
    },
    hasExploreMore: true,
    exploreContent: `<h3>Your Taste, Unbound</h3>
    <p>At Sirened, we believe in the power of authentic discovery. Unlike other platforms that use limiting algorithms, we connect you directly with stories you'll love.</p>
    <h4>Discover Your Next Read</h4>
    <ul>
      <li>Personalized recommendations</li>
      <li>Direct author interactions</li>
      <li>Easy discovery tools</li>
      <li>Direct support for authors</li>
      <li>Engaging community</li>
    </ul>
    <p>Find your next favorite book today.</p>`,
  },
  {
    title: "Spellbound by a False Tune",
    description:
      "You crave adventure, but industry giants only offer a bargain bin. The storytellers you love, suffer in obscurity.",
    videoUrl: "/videos/reader-video-2.mp4",
    image: {
      src: "/images/book-connection.svg",
      alt: "Reader connecting with books",
    },
    hasExploreMore: true,
    exploreContent: `<h3>Spellbound by a False Tune</h3>
    <p>Many readers feel lost in the maze of traditional publishing. The industry giants often prioritize profit over quality, leaving amazing stories unheard.</p>
    <h4>A Better Way</h4>
    <p>Sirened is changing the narrative. Our platform provides a more direct connection between readers and independent authors, ensuring that quality stories get the attention they deserve.</p>
    <p>Discover something new with Sirened.</p>`,
  },
  {
    title: "A Song Breaks the Charm",
    description:
      "Discover a realm where your storytellers thrive, a place where quality trumps quantity. Sirened cuts through the chaos",
    videoUrl: "/videos/reader-video-3.mp4",
    image: {
      src: "/images/reader-community.svg",
      alt: "Reader community discussion",
    },
    hasExploreMore: true,
    exploreContent: `<h3>A Song Breaks the Charm</h3>
    <p>Sirened is a sanctuary for quality storytelling. We focus on fostering a supportive community where authors and readers connect directly.</p>
    <h4>Our Mission</h4>
    <p>To provide an independent publishing platform that celebrates originality, fosters connection, and provides authors the tools they need to share their stories with the world.</p>
    <p>Join the Sirened community.</p>`,
  },
  {
    title: "Step into the indie square",
    description:
      "Enter Sirened's marketplace. Find stories worth their weight, sent straight from the creators' doors.",
    videoUrl: "/videos/reader-video-4.mp4",
    image: {
      src: "/images/author-support.svg",
      alt: "Supporting favorite authors",
    },
    hasExploreMore: true,
    exploreContent: `<h3>The Indie Square</h3>
    <p>Discover books you'll love directly from independent authors. Sirened cuts out the middleman, allowing creators to connect with their audience directly.</p>
    <h4>What to Expect</h4>
    <ul>
      <li>Unique stories</li>
      <li>Direct author support</li>
      <li>A welcoming community</li>
      <li>High-quality writing</li>
    </ul>
    <p>Explore the Indie Square today.</p>`,
  },
  {
    title: "Support your storytellers",
    description:
      "Join Sirened — back indie authors directly, not the giants who bind them. Sign up and rewrite the ending",
    videoUrl: "/videos/reader-video-5.mp4", // Final video
    image: {
      src: "/images/reading-journey.svg",
      alt: "Reading journey visualization",
    },
    hasExploreMore: true,
    exploreContent: `<h3>Support Your Storytellers</h3>
    <p>By supporting independent authors, you're not just buying a book; you're investing in their creativity and helping them share their unique voices with the world.</p>
    <h4>Why Support Indies?</h4>
    <ul>
      <li>Support independent artists</li>
      <li>Discover unique stories</li>
      <li>Connect with authors</li>
      <li>Foster creativity</li>
    </ul>
    <p>Join us in supporting independent authors.</p>`,
  },
];

// Updated author panels with video URLs
const authorPanels = [
  {
    title: "Escape the sirens of the industry",
    description:
      "Break free from predatory publishing and find sanctuary in a harbor built for independent voices.",
    videoUrl: "/videos/author-video-1.mp4", // First video
    image: {
      src: "/images/author-freedom.svg",
      alt: "Author breaking free from chains",
    },
    hasExploreMore: true,
    exploreContent: `<h3>Escape the Sirens of the Industry</h3>
    <p>Traditional publishing often takes control away from authors. At Sirened, we believe creators should maintain ownership of their work while still reaching a wide audience.</p>
    <h4>Your Work, Your Terms</h4>
    <ul>
      <li>Keep creative control</li>
      <li>Set your own prices</li>
      <li>Maintain rights to your work</li>
      <li>Direct connection to readers</li>
    </ul>
    <p>Publish on your terms with Sirened.</p>`,
  },
  {
    title: "Crafting beyond the shadows",
    description:
      "Emerge from the shadows of obscurity. Sirened helps your stories reach the readers who crave them most.",
    videoUrl: "/videos/author-video-2.mp4",
    image: {
      src: "/images/author-visibility.svg",
      alt: "Author stepping into spotlight",
    },
    hasExploreMore: true,
    exploreContent: `<h3>Crafting Beyond the Shadows</h3>
    <p>Many talented authors remain undiscovered in today's crowded publishing landscape. Sirened's platform helps your work stand out and reach your ideal audience.</p>
    <h4>Be Discovered</h4>
    <p>Our platform helps connect your stories with readers who are specifically looking for your unique voice and perspective.</p>
    <p>Step into the spotlight with Sirened.</p>`,
  },
  {
    title: "Direct line to your readers",
    description:
      "No middlemen muddying the waters. Connect directly with your audience and foster a community around your work.",
    videoUrl: "/videos/author-video-3.mp4",
    image: {
      src: "/images/author-connect.svg",
      alt: "Author connecting with readers",
    },
    hasExploreMore: true,
    exploreContent: `<h3>Direct Line to Your Readers</h3>
    <p>Build a genuine connection with your audience without interference. Sirened provides the tools you need to cultivate a community around your storytelling.</p>
    <h4>Community Building Tools</h4>
    <ul>
      <li>Reader messaging</li>
      <li>Community forums</li>
      <li>Event announcements</li>
      <li>Direct feedback channels</li>
    </ul>
    <p>Create lasting connections with Sirened.</p>`,
  },
  {
    title: "Fair compensation for your craft",
    description:
      "We believe in fair compensation. Keep more of what you earn and gain transparency in the process.",
    videoUrl: "/videos/author-video-4.mp4",
    image: {
      src: "/images/author-earnings.svg",
      alt: "Author receiving fair payment",
    },
    hasExploreMore: true,
    exploreContent: `<h3>Fair Compensation for Your Craft</h3>
    <p>Traditional publishing often takes the lion's share of profits. Sirened ensures you receive fair compensation for your creative work.</p>
    <h4>Transparent Earnings</h4>
    <ul>
      <li>Higher royalty percentages</li>
      <li>Clear reporting dashboard</li>
      <li>Multiple revenue streams</li>
      <li>Direct reader support options</li>
    </ul>
    <p>Earn what you deserve with Sirened.</p>`,
  },
  {
    title: "Tools for your journey",
    description:
      "Access a suite of tools designed to enhance your writing process, from ideation to publication and promotion.",
    videoUrl: "/videos/author-video-5.mp4", // Final video
    image: {
      src: "/images/author-tools.svg",
      alt: "Author using digital tools",
    },
    hasExploreMore: true,
    exploreContent: `<h3>Tools for Your Journey</h3>
    <p>Sirened provides everything you need to succeed as an independent author, from creative supports to marketing assistance.</p>
    <h4>Your Author Toolbox</h4>
    <ul>
      <li>Formatting assistance</li>
      <li>Cover design resources</li>
      <li>Marketing templates</li>
      <li>Analytics dashboard</li>
      <li>Promotion opportunities</li>
    </ul>
    <p>Succeed with Sirened's comprehensive tools.</p>`,
  },
];