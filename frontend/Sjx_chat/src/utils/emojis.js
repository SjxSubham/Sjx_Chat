export const funEmojis = [
	"👾", "⭐", "🌟", "🎉", "🎊", "🎈", "🎁", "🎂", "🎄", "🎃",
	"🎗", "🎟", "🎫", "🎖", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽",
	"🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥅",
	"🏒", "🏑", "🏏", "⛳", "🏹", "🎣", "🥊", "🥋", "🎽", "⛸",
	"🥌", "🛷", "🎿", "⛷", "🏂", "🏋️", "🤼", "🤸", "🤺", "⛹️",
	"🤾", "🏌️", "🏇", "🧘"
];

// Popular emojis for quick access
export const popularEmojis = [
	"😀", "😂", "😍", "🥰", "😊", "😎", "🤔", "😢", "😭", "😡",
	"🤯", "🥳", "😴", "🤤", "👍", "👎", "👏", "🙌", "🤝", "🙏",
	"❤️", "💕", "💯", "🔥", "✨", "⭐", "�", "🎊", "💪", "🙈"
];

// Reaction emojis
export const reactionEmojis = [
	"👍", "👎", "❤️", "😂", "😮", "😢", "😡", "🎉"
];

export const getRandomEmoji = () => {
	return funEmojis[Math.floor(Math.random() * funEmojis.length)];
};

export const getRandomPopularEmoji = () => {
	return popularEmojis[Math.floor(Math.random() * popularEmojis.length)];
};