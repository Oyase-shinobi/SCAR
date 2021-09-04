import Arweave from 'arweave'
import { Anchor, DataTable, Heading, Box, Text, Grid } from 'grommet'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import Link from 'next/link'
import prettyBytes from 'pretty-bytes'
import { formatNumber } from '../../utils/formatter'

const arweave = Arweave.init({})

export default function Transaction() {
  const router = useRouter()
  const { hash } = router.query as { hash?: string }
  const { data: status } = useSWR(hash ? ['transactions', 'getStatus', hash] : null, () =>
    arweave.transactions.getStatus(hash!),
  )
  const { data: transaction } = useSWR(hash ? ['transactions', 'get', hash] : null, () =>
    arweave.transactions.get(hash!),
  )

  if (!hash) {
    return null
  }
  return (
    <Box pad="medium" width={{ max: '940px', width: '100%' }} margin="0 auto">
      <Heading level="3">Block</Heading>
      <Link href={`/block/${status?.confirmed?.block_indep_hash}`} passHref={true}>
        <Anchor>{status?.confirmed?.block_indep_hash || '-'}</Anchor>
      </Link>
      <Grid
        rows={['100%']}
        columns={['1/3', '1/3', '1/3']}
        fill="vertical"
        areas={[
          { name: 'height', start: [0, 0], end: [0, 0] },
          { name: 'reward', start: [1, 0], end: [1, 0] },
          { name: 'size', start: [2, 0], end: [2, 0] },
        ]}
      >
        <Box gridArea="height">
          <Heading level="3">Height</Heading>
          <Text>
            {status?.confirmed ? formatNumber.format(status?.confirmed?.block_height) : '-'}
          </Text>
        </Box>
        <Box gridArea="reward">
          <Heading level="3">Reward</Heading>
          <Text>{transaction ? formatNumber.format(parseInt(transaction.reward, 10)) : '-'}</Text>
        </Box>
        <Box gridArea="size">
          <Heading level="3">Size</Heading>
          <Text>{transaction ? prettyBytes(parseInt(transaction.data_size, 10)) : '-'}</Text>
        </Box>
      </Grid>
      <Heading level="3">Tags</Heading>
      <DataTable
        primaryKey="name"
        columns={[
          {
            property: 'name',
            render: (tag) => Arweave.utils.b64UrlToString(tag.name),
            header: 'Name',
          },
          {
            property: 'value',
            render: (tag) => Arweave.utils.b64UrlToString(tag.value),
            header: 'Value',
          },
        ]}
        data={transaction?.tags}
      />
      <Heading level="3">Data</Heading>
      <Text wordBreak="break-all">
        <code>{transaction ? Buffer.from(transaction.data).toString() : '-'}</code>
      </Text>
    </Box>
  )
}