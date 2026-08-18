import type { Icon } from '@phosphor-icons/react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowsLeftRight,
  Bank,
  CreditCard,
  Money,
  Receipt,
  Wallet,
} from '@phosphor-icons/react/ssr'
import type { AccountType, TransactionType } from '@/lib/types'

export const ACCOUNT_TYPE_ICONS: Record<AccountType, Icon> = {
  bank: Bank,
  cash: Money,
  e_wallet: Wallet,
  credit_card: CreditCard,
}

export const TRANSACTION_TYPE_ICONS: Record<TransactionType, Icon> = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowsLeftRight,
  adjustment: Receipt,
}
