export default function Loader(props: { show: boolean }) {
  const { show } = props
  return show ? <div className='loader' /> : null
}
