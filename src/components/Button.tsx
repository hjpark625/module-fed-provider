function Button({ text }: { text?: string }) {
  const handleClick = () => {
    console.log('Button clicked')
  }
  return (
    <button
      className="w-[100px] h-[100px] border rounded-sm border-black bg-slate-400"
      type="button"
      onClick={handleClick}
    >
      {text ?? 'Button From React'}
    </button>
  )
}

export default Button
