// Titolo con gradient violet→pink. Usato come heading principale in tutta l'app.
// `size`: sm | md | lg | xl

const SIZES = {
  sm: 'clamp(16px, 2.2dvh, 20px)',
  md: 'clamp(22px, 3.2dvh, 30px)',
  lg: 'clamp(26px, 4vw, 38px)',
  xl: 'clamp(36px, 7vw, 56px)',
}

const GradientTitle = ({ as = 'h1', size = 'md', children, style, ...rest }) => {
  const Tag = as
  return (
    <Tag
      style={{
        margin: 0,
        fontSize: SIZES[size] ?? SIZES.md,
        fontFamily: "'Baloo 2', cursive",
        fontWeight: 700,
        letterSpacing: '-0.01em',
        background: 'linear-gradient(120deg, #7C3AED 30%, #EC4899 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1.15,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default GradientTitle
