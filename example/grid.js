// grid with filtering
import $, { mount, query, html } from 'spect/dom'

$('#transactions', Transactions)

function Transactions (target, props) {
  // FIXME: make these states queries
  const {
    asc=true,
    sortBy=columns[1].id,
    page=9,
    from=Dates.day.shift(Dates.day.floor(new Date), -7),
    to=Dates.day.ceil(new Date),
    merchantIds=[]
  } = query()

  const { rowsPerPage=30 } = state()

  const { transactions: {data: trx, metadata: trxMeta} } = store()
  let trxCount = trxMeta.count
  let trxOffset = trxMeta.offset

  // on any state change - refetch trx
  let [trx, fetchingTrx, errorTrx] = async(() => {
    return TransactionActions.fetchTransactionsRequest({
      IsAsc: isAsc,
      SortBy: sortBy,
      SkipCount: page * rowsPerPage,
      MaximumCount: rowsPerPage,
      ProcessedAfter: formatDate(from, 'isoDateTime'),
      ProcessedBefore: formatDate(to, 'isoDateTime'),
      MerchantIds: merchantIds
    })
  }, [page, from, to, sortBy, isAsc, merchantIds])

  const {
    fetchingOne,
    selectedTransaction
  } = select(state => ({
    fetchingOne: state.transactions.fetchingOne,
    selectedTransaction: state.transactions.read
  }))

  html`<${el}>
    <div class="flex-row-left mb-3">
      <div class="${DateRangeInput} mr-1" value=${[from, to]} onSelect=${([from, to]) => query({from, to})}/>
      <div class="${SelectInput} mr-1"
        placeholder="Merchant ID"
        selected=${merchantIds}
        options=${async value => {
          let resp = await api.getTransactionsFilterOptions({
            MaximumCount: 50,
            AccountNumbers: value,
            ProcessedAfter: formatDate(from, 'isoDateTime'),
            ProcessedBefore: formatDate(to, 'isoDateTime'),
          })
          return resp.data.payload.Merchants.map(m => ({label: m.Name, value: m.Id, disabled: m.IsDeleted}))
        }}
        onSelect=${({value}) => setMerchantIds([...merchantIds, value])}
        onDeselect=${({value}) => (setMerchantIds(merchantIds.filter( id => id !== value )))}/>
      <div class="${TextInput} mr-1" placeholder="Type merchant ID"/>
      <div class="${TextInput} mr-1" placeholder="Transaction type"/>
      <button class="${Button} ml-auto">Clear Filters</button>
    </div>

    <div class="bg-white elevation-0 flex-0-1 mh-10">
      <div
        class="@Grid h-100% flex-column"
        data=${trx}
        columns=${columns}
        sortBy=${sortBy}
        asc=${isAsc}
        onSelect=${(item) => {
          dispatch(TransactionActions.fetchTransactionByIdRequest(item.id))
        }}
        onScroll=${() => {
        }}
        onSort=${(column) => {
          if (column.id === sortBy) setAsc(!isAsc)
          else {
            setAsc(true)
            setSortBy(column.id)
          }
        }}
        details=${item => fetchingOne ? 'Loading...' + JSON.stringify(item) : JSON.stringify(selectedTransaction, null, '\t')}/>
    </div>

    <div class="flex-row mt-3">
      <${Pagination} class="ml-auto" page=${page} perPage=${rowsPerPage} total=${trxCount} onPage=${p => {
        if (p < 0) return
        if (p > Math.floor(trxCount / rowsPerPage)) return
        setPage(p)
      }} loading=${fetching}/>
    </div>
  <//>`
}
