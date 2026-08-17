import { notFound } from 'next/navigation'
import Link from 'next/link'
import TransactionForm from '@/components/transaction-form'
import { getCurrentUser } from '@/lib/insforge/server'
import { getAccounts, getCategories, getProfile, getTransaction } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const [profile, accounts, categories, transaction] = await Promise.all([
    getProfile(user!.id),
    getAccounts(user!.id),
    getCategories(user!.id),
    getTransaction(user!.id, id),
  ])

  if (!transaction) notFound()

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Transaction / edit</span>
          <h1>Edit transaksi.</h1>
          <p>Ubah detail transaksi; saldo akun dihitung ulang secara atomik.</p>
        </div>
        <div className="heading-actions">
          <Link className="page-button ghost" href={`/app/transactions/${transaction.id}`}><span>←</span> Kembali</Link>
        </div>
      </section>

      <TransactionForm
        accounts={accounts}
        categories={categories}
        transaction={transaction}
        timezone={profile?.timezone ?? 'Asia/Jakarta'}
        onDone={() => undefined}
      />
    </div>
  )
}