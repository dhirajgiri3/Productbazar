// Helper function for witty stat interpretation
export const interpretStats = (views, upvotes, bookmarks, comments, name) => {
  name = name || "this marvel"; // Fallback name

  if (views === 0)
    return `Shh! It's brand new! You might be the very first explorer to lay eyes on ${name}. Go on, make your mark!`;
  if (views > 0 && upvotes === 0 && bookmarks === 0 && comments === 0)
    return `Intriguing... ${views} souls have peered at ${name}, but the crowd remains silent. Waiting for a hero? Or maybe just shy? Your move!`;
  if (upvotes > views / 3 && upvotes >= bookmarks)
    return `Whoa! Seems like ${name} is hitting the right chords! ${upvotes} thumbs are enthusiastically up – a real crowd-pleaser brewing here!`;
  if (bookmarks > views / 4 && bookmarks > upvotes)
    return `Clever adventurers! ${bookmarks} explorers have wisely stashed ${name} away for later. Planning a deeper dive, perhaps? Smart move!`;
  if (comments > 0)
    return `The conversation has begun! ${comments} brave souls have shared their thoughts on ${name}. What secrets or insights will you add?`;
  if (upvotes > 0 || bookmarks > 0)
    return `${upvotes} appreciations and ${bookmarks} saved treasures... ${name} is definitely making waves. The plot thickens!`;

  return `With ${views} explorers checking it out, the story of ${name} continues to unfold. Every interaction adds a new verse!`;
};