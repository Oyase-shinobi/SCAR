import { Anchor, Box, Nav, Spinner, TextInput } from 'grommet'
import { ReactNode, useMemo, useState } from 'react'
import * as Icon from 'grommet-icons'
import useSWR from 'swr'
import compact from 'lodash/compact'
import { useNavigate } from 'react-router'
import { arweave } from '../utils/arweave'
import AnchorLink from './anchor-link'

export default function Layout(props: { children: ReactNode }) {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const { data, isValidating } = useSWR(
    keyword ? ['search', keyword] : null,
    async () => {
      try {
        const [block, transaction, address] = await Promise.all([
          arweave.blocks.get(keyword).catch(() => undefined),
          arweave.transactions.get(keyword).catch(() => undefined),
          arweave.wallets
            .getBalance(keyword)
            .then((balance) => (balance === '0' || !/^\d+$/.test(balance) ? undefined : balance))
            .catch(() => undefined),
        ])
        return { transaction, block, address }
      } catch {
        return undefined
      }
    },
    { revalidateOnFocus: false },
  )
  const suggestions = useMemo(
    () =>
      data
        ? compact([
            data.block
              ? {
                  label: `Block: ${data.block.indep_hash}`,
                  value: `/block/${data.block.indep_hash}`,
                }
              : undefined,
            data.transaction
              ? { label: `Tx: ${data.transaction.id}`, value: `/tx/${data.transaction.id}` }
              : undefined,
            data.address
              ? { label: `Address: ${keyword}`, value: `/address/${keyword}` }
              : undefined,
          ])
        : [],
    [data, keyword],
  )

  return (
    <>
      <Nav direction="row" background="dark-1" pad="small" justify="center">
        <Box
          width={{ max: '940px' }}
          pad={{ left: 'medium', right: 'medium' }}
          fill="horizontal"
          direction="row"
          align="center"
          gap="20px"
        >
          <Box flex={{ shrink: 0 }}>
            <AnchorLink to="/" color="light-1">
              SCAR
            </AnchorLink>
          </Box>
          <Box fill="horizontal">
            <TextInput
              size="xsmall"
              icon={isValidating ? <Spinner /> : <Icon.Search />}
              plain={true}
              placeholder="block, transaction or address hash"
              value={keyword}
              suggestions={suggestions}
              onChange={(e) => setKeyword(e.target.value)}
              onSuggestionSelect={(s) => {
                navigate(s.suggestion.value)
              }}
            />
          </Box>
          <Anchor href="https://github.com/MichaelBuhler/scar" target="_blank" style={{ lineHeight: 0 }}>
            <Icon.Github />
          </Anchor>
        </Box>
      </Nav>
      {props.children}
    </>
  )
}
