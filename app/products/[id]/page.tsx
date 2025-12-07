import ProductEditClient from "../../_components/ProductEditClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function ProductEditPage({ params }: { params: { id: string } }) {
  return <ProductEditClient id={params.id} />
}
