import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import gsap from 'gsap'
import './CardSwap.css'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, className, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`card ${customClass ?? ''} ${className ?? ''}`.trim()}
  />
))
Card.displayName = 'Card'

interface Slot {
  x: number
  y: number
  z: number
  scale: number
  zIndex: number
}

const makeSlot = (i: number, total: number): Slot => {
  // i = 0 is Front Card (lowest Y, highest zIndex)
  // i = 1 is Middle Card (slightly higher Y so top peeks above front card)
  // i = 2 is Back Card (highest Y so top peeks above middle card)
  const stepY = 32
  const maxOffsetY = (total - 1) * stepY
  const currentY = maxOffsetY - i * stepY

  return {
    x: 0,
    y: currentY,
    z: -i * 50,
    scale: 1 - i * 0.035,
    zIndex: total - i,
  }
}

const placeNow = (el: HTMLElement | null, slot: Slot) => {
  if (!el) return
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    scale: slot.scale,
    xPercent: -50,
    yPercent: -50,
    skewY: 0, // NO tilt! Straight facing forward
    rotate: 0,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  })
}

export interface CardSwapProps {
  width?: number | string
  height?: number | string
  autoSwap?: boolean
  delay?: number
  activeIndex?: number
  onCardClick?: (idx: number) => void
  children: React.ReactNode
}

const CardSwap: React.FC<CardSwapProps> = ({
  width = 680,
  height = 420,
  activeIndex,
  onCardClick,
  children,
}) => {
  const childArr = useMemo(() => Children.toArray(children), [children])
  const refs = useMemo(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  )

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i))
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const container = useRef<HTMLDivElement>(null)

  // Initialize initial straight stacked slot positions
  useEffect(() => {
    const total = refs.length
    refs.forEach((r, i) => placeNow(r.current, makeSlot(i, total)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Controlled rotation to target card index when activeIndex changes or on card click
  useEffect(() => {
    if (activeIndex === undefined || activeIndex === null) return
    const total = refs.length
    if (total === 0) return

    const currentOrder = [...order.current]
    const targetPos = currentOrder.indexOf(activeIndex)
    if (targetPos === 0 || targetPos === -1) return // Already at front

    // Rotate order array so targetIndex becomes first (Front)
    const newOrder = [
      ...currentOrder.slice(targetPos),
      ...currentOrder.slice(0, targetPos),
    ]

    const tl = gsap.timeline()
    tlRef.current = tl

    // Smoothly animate all cards to their new slot positions
    newOrder.forEach((cardIdx, slotIdx) => {
      const el = refs[cardIdx].current
      if (!el) return
      const slot = makeSlot(slotIdx, total)

      tl.to(
        el,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          scale: slot.scale,
          zIndex: slot.zIndex,
          duration: 0.75,
          ease: 'power3.out',
        },
        0
      )
    })

    order.current = newOrder
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  const rendered = childArr.map((child, i) => {
    const childElement = child as React.ReactElement<{
      style?: React.CSSProperties
      onClick?: (e: React.MouseEvent) => void
    }>
    if (!isValidElement(child)) return child
    return cloneElement(child as React.ReactElement<any>, {
      key: i,
      ref: refs[i],
      style: { width, height, ...(childElement.props.style ?? {}) },
      onClick: (e: React.MouseEvent) => {
        childElement.props.onClick?.(e)
        onCardClick?.(i)
      },
    })
  })

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  )
}

export default CardSwap
