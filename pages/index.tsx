import { GraphQLClient } from 'graphql-request'
import useSWR from 'swr'
import Arweave from 'arweave'
import { useMemo } from 'react'
import { Box, DataTable, Grid, Heading, Text, WorldMap } from 'grommet'
import TimeAgo from 'timeago-react'
import prettyBytes from 'pretty-bytes'
import { getSdk } from '../generated/graphql'
import usePeersLocation from '../hooks/use-peers-location'
import { formatNumber } from '../utils/formatter'

const arweave = Arweave.init({})
const client = new GraphQLClient('https://arweave.net/graphql')
const sdk = getSdk(client)

export default function Index() {
  const { data: locations } = usePeersLocation({
    refreshInterval: 30 * 1000,
    revalidateOnFocus: false,
  })
  const places = useMemo(
    () => locations?.map((place) => ({ location: [place.lat, place.lon], color: 'accent-1' })),
    [locations],
  )
  const { data: info } = useSWR(['getInfo'], () => arweave.network.getInfo(), {
    refreshInterval: 2000,
  })
  const { data: blocks } = useSWR(
    ['listBlocks'],
    async () => {
      const {
        blocks: { edges },
      } = await sdk.listBlocks({ first: 10 })
      return Promise.all(edges.map(({ node }) => arweave.blocks.get(node.id)))
    },
    { refreshInterval: 2000 },
  )
  const { data: transactions } = useSWR(
    ['listTransactions'],
    async () => {
      const {
        transactions: { edges },
      } = await sdk.listTransactions({ first: 10 })
      return edges.map(({ node }) => node)
    },
    { refreshInterval: 2000 },
  )

  return (
    <Box pad="medium" width={{ max: '940px', width: '100%' }} margin="0 auto">
      <Grid
        rows={['1/2', '1/2']}
        columns={['2/3', '16.66%', '16.66%']}
        fill="vertical"
        areas={[
          { name: 'map', start: [0, 0], end: [0, 1] },
          { name: 'peers', start: [1, 0], end: [1, 0] },
          { name: 'blocks', start: [1, 1], end: [1, 1] },
          { name: 'queue', start: [2, 0], end: [2, 0] },
          { name: 'latency', start: [2, 1], end: [2, 1] },
        ]}
      >
        <WorldMap gridArea="map" places={places} alignSelf="center" height="max-content" />
        {info ? (
          <>
            <Box gridArea="peers" align="end">
              <Heading level="3" margin="0">
                Peers
              </Heading>
              <Text>{formatNumber.format(info.peers)}</Text>
            </Box>
            <Box gridArea="blocks" align="end">
              <Heading level="3" margin="0">
                Blocks
              </Heading>
              <Text>{formatNumber.format(info.blocks)}</Text>
            </Box>
            <Box gridArea="queue" align="end">
              <Heading level="3" margin="0">
                Queue
              </Heading>
              <Text>{formatNumber.format(info.queue_length)}</Text>
            </Box>
            <Box gridArea="latency" align="end">
              <Heading level="3" margin="0">
                Latency
              </Heading>
              <Text>{formatNumber.format(info.node_state_latency)}</Text>
            </Box>
          </>
        ) : null}
      </Grid>
      <Heading level="3">Latest blocks</Heading>
      <DataTable
        primaryKey="indep_hash"
        columns={[
          { property: 'height', render: (block) => `#${block.height}`, header: 'Height' },
          {
            property: 'timestamp',
            render: (block) => <TimeAgo datetime={block.timestamp * 1000} />,
            header: 'Timestamp',
          },
          {
            property: 'block_size',
            render: (block) =>
              prettyBytes(parseInt(block.block_size as unknown as string, 10), { locale: true }),
            header: 'Block size',
            align: 'end',
          },
          { property: 'txs', render: (block) => block.txs.length, header: 'Txs', align: 'end' },
        ]}
        data={blocks}
        onClickRow={console.log}
      />
      <Heading level="3">Latest transactions</Heading>
      <DataTable
        primaryKey="id"
        columns={[
          {
            property: 'id',
            render: (transaction) => <Text truncate={true}>{transaction.id}</Text>,
            header: 'Hash',
          },
          {
            property: 'data.type',
            header: 'Type',
            render: (transaction) => (
              <Text truncate={true}>
                {transaction.recipient ? '[transfer]' : transaction.data.type || '-'}
              </Text>
            ),
          },
          {
            property: 'data.size',
            render: (transaction) => (
              <Text truncate={true}>
                {transaction.recipient
                  ? ''
                  : prettyBytes(parseInt(transaction.data.size, 10), { locale: true })}
              </Text>
            ),
            align: 'end',
            header: 'Size',
          },
          {
            property: 'fee.ar',
            render: (transaction) => (
              <Text truncate={true}>
                {transaction.recipient
                  ? `${formatNumber.format(parseFloat(transaction.quantity.ar))} AR`
                  : `${formatNumber.format(parseInt(transaction.fee.winston, 10))} w`}
              </Text>
            ),
            align: 'end',
            header: 'Fee/Quantity',
          },
        ]}
        data={transactions}
        onClickRow={console.log}
      />
    </Box>
  )
}
