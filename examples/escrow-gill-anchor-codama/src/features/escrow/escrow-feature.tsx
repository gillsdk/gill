'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppHero } from '@/components/app-hero'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSolana } from '@/components/solana/use-solana'
import { useEscrowMake } from './data-access/use-escrow-make'
import { useEscrowTake } from './data-access/use-escrow-take'
import { useEscrowRefund } from './data-access/use-escrow-refund'
import { useValidateEscrow } from './data-access/use-validate-escrow'
import { AppErrorBoundary } from '@/components/error-boundary'
import { DEVNET_TOKENS, EXAMPLE_ESCROW } from './constants'
import { toast } from 'sonner'
import type { Address } from 'gill'
import { ESCROW_ANCHOR_PROGRAM_ADDRESS } from '@/generated/programs'
function EscrowFeatureContent() {
  const [mounted, setMounted] = useState(false)
  const [programDeployed, setProgramDeployed] = useState<boolean | null>(null)
  const { connected, cluster, client, account } = useSolana()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if the escrow program is deployed
  useEffect(() => {
    if (!client) return

    const checkProgram = async () => {
      try {
        const programInfo = await client.rpc.getAccountInfo(ESCROW_ANCHOR_PROGRAM_ADDRESS).send()
        setProgramDeployed(!!programInfo.value)
        console.log('Program deployment check:', {
          address: ESCROW_ANCHOR_PROGRAM_ADDRESS,
          deployed: !!programInfo.value,
          cluster: cluster?.id,
        })
      } catch (error) {
        console.error('Failed to check program deployment:', error)
        setProgramDeployed(false)
      }
    }

    checkProgram()
  }, [client, cluster])

  const [makeForm, setMakeForm] = useState({
    mintA: '',
    mintB: '',
    seed: EXAMPLE_ESCROW.seed.toString(),
    depositAmount: EXAMPLE_ESCROW.depositAmount.toString(),
    receiveAmount: EXAMPLE_ESCROW.receiveAmount.toString(),
  })
  const [takeForm, setTakeForm] = useState({
    escrowAccount: '',
    maker: '',
    mintA: '',
    mintB: '',
  })
  const [refundForm, setRefundForm] = useState({
    escrowAccount: '',
    mintA: '',
  })

  const makeMutation = useEscrowMake()
  const takeMutation = useEscrowTake()
  const refundMutation = useEscrowRefund()
  const validateMutation = useValidateEscrow()

  const fillExampleTokens = () => {
    setMakeForm({
      ...makeForm,
      mintA: DEVNET_TOKENS.USDC,
      mintB: DEVNET_TOKENS.USDT,
    })
  }

  const handleValidateEscrow = async () => {
    if (!connected || !validateMutation || !makeForm.mintA || !makeForm.mintB) return

    const depositAmt = parseInt(makeForm.depositAmount)
    if (isNaN(depositAmt) || depositAmt <= 0) {
      toast.error('Please enter a valid deposit amount!')
      return
    }

    try {
      const result = await validateMutation.mutateAsync({
        mintA: makeForm.mintA as Address,
        mintB: makeForm.mintB as Address,
        depositAmt,
      })

      if (result.errors.length > 0) {
        toast.error(`Validation failed: ${result.errors.join(', ')}`)
      } else {
        toast.success('Validation passed! You can proceed with creating the escrow.')

        if (result.warnings.length > 0) {
          toast.warning(`Warnings: ${result.warnings.join(', ')}`)
        }
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('Validation failed due to network error.')
    }
  }

  const handleMakeEscrow = async () => {
    if (!connected || !makeMutation) return

    // Basic validation
    if (makeForm.mintA === makeForm.mintB) {
      toast.error('Token A and Token B must be different!')
      return
    }

    const seed = parseInt(makeForm.seed)
    const depositAmt = parseInt(makeForm.depositAmount)
    const receiveAmt = parseInt(makeForm.receiveAmount)

    if (isNaN(seed) || isNaN(depositAmt) || isNaN(receiveAmt)) {
      toast.error('Please enter valid numbers for seed and amounts!')
      return
    }

    if (depositAmt <= 0 || receiveAmt <= 0) {
      toast.error('Amounts must be greater than 0!')
      return
    }

    try {
      await makeMutation.mutateAsync({
        mintA: makeForm.mintA as Address,
        mintB: makeForm.mintB as Address,
        seed,
        depositAmt,
        receiveAmt,
      })
      setMakeForm({
        mintA: '',
        mintB: '',
        seed: '',
        depositAmount: '',
        receiveAmount: '',
      })
    } catch (error) {
      console.error('Make escrow failed:', error)
    }
  }

  const handleTakeEscrow = async () => {
    if (!connected || !takeMutation) return

    try {
      await takeMutation.mutateAsync({
        maker: takeForm.maker as Address,
        mintA: takeForm.mintA as Address,
        mintB: takeForm.mintB as Address,
        escrow: takeForm.escrowAccount as Address,
      })
      setTakeForm({
        escrowAccount: '',
        maker: '',
        mintA: '',
        mintB: '',
      })
    } catch (error) {
      console.error('Take escrow failed:', error)
    }
  }

  const handleRefundEscrow = async () => {
    if (!connected || !refundMutation) return

    try {
      await refundMutation.mutateAsync({
        mintA: refundForm.mintA as Address,
        escrow: refundForm.escrowAccount as Address,
      })
      setRefundForm({
        escrowAccount: '',
        mintA: '',
      })
    } catch (error) {
      console.error('Refund escrow failed:', error)
    }
  }

  if (!mounted || !cluster) {
    return (
      <div>
        <AppHero title="Escrow" subtitle="Loading..." />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div>
        <AppHero title="Escrow" subtitle="Connect your wallet to create and manage escrow transactions." />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Please connect your wallet to use the escrow functionality.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="Escrow" subtitle="Create, take, and refund escrow transactions on Solana." />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Network Info */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Network Information</h3>
              <p className="text-sm text-muted-foreground">
                Cluster: <span className="font-mono">{JSON.stringify(cluster) || 'Unknown'}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Program: <span className="font-mono">{ESCROW_ANCHOR_PROGRAM_ADDRESS}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Status:{' '}
                {programDeployed === null
                  ? '🔄 Checking...'
                  : programDeployed
                    ? '✅ Program Deployed'
                    : '❌ Program Not Found'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Wallet Status</p>
              <p className="text-sm text-muted-foreground">{connected ? '✅ Connected' : '❌ Disconnected'}</p>
            </div>
          </div>
        </div>

        {/* Program Deployment Warning */}
        {programDeployed === false && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="font-medium text-red-800 dark:text-red-200">⚠️ Program Not Deployed</h4>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              The escrow program is not deployed on this network ({cluster?.id}). You need to deploy the program first
              or switch to a network where it&apos;s already deployed.
            </p>
          </div>
        )}

        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tokens">Test Tokens</TabsTrigger>
            <TabsTrigger value="make">Make Escrow</TabsTrigger>
            <TabsTrigger value="take">Take Escrow</TabsTrigger>
            <TabsTrigger value="refund">Refund Escrow</TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Tokens</CardTitle>
                <CardDescription>
                  Use these devnet test tokens for testing the escrow functionality. You can get test tokens from
                  faucets or create your own.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium mb-2">Connection Info:</h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Network:</strong> {cluster?.id || 'Unknown'}
                      </p>
                      <p>
                        <strong>Cluster:</strong> {JSON.stringify(cluster) || 'Unknown'}
                      </p>
                      <p>
                        <strong>Wallet:</strong> {account?.address || 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Available Devnet Test Tokens:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">USDC (Test)</p>
                          <p className="text-sm text-muted-foreground font-mono">{DEVNET_TOKENS.USDC}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(DEVNET_TOKENS.USDC)}
                        >
                          Copy
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">USDT (Test)</p>
                          <p className="text-sm text-muted-foreground font-mono">{DEVNET_TOKENS.USDT}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(DEVNET_TOKENS.USDT)}
                        >
                          Copy
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Wrapped SOL</p>
                          <p className="text-sm text-muted-foreground font-mono">{DEVNET_TOKENS.WSOL}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(DEVNET_TOKENS.WSOL)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h4 className="font-medium mb-2">Getting Test Tokens:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Visit the{' '}
                        <a
                          href="https://faucet.solana.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Solana Faucet
                        </a>{' '}
                        to get test SOL
                      </li>
                      <li>• Use a token faucet or swap service to get test tokens</li>
                      <li>• Make sure you&apos;re connected to Devnet network</li>
                      <li>• You need tokens in your wallet before creating an escrow</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="make" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Escrow</CardTitle>
                <CardDescription>
                  Create a new escrow transaction. You will deposit Token A and receive Token B when someone takes the
                  escrow.
                </CardDescription>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={fillExampleTokens}>
                    Fill Example Tokens (Devnet)
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mintA">Token A Mint Address</Label>
                    <Input
                      id="mintA"
                      placeholder="Token A mint address (token you'll deposit)"
                      value={makeForm.mintA}
                      onChange={(e) => setMakeForm({ ...makeForm, mintA: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">You must own this token to create the escrow</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mintB">Token B Mint Address</Label>
                    <Input
                      id="mintB"
                      placeholder="Token B mint address (token you'll receive)"
                      value={makeForm.mintB}
                      onChange={(e) => setMakeForm({ ...makeForm, mintB: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      The taker must own this token to complete the escrow
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seed">Seed</Label>
                    <Input
                      id="seed"
                      type="number"
                      placeholder="Random seed number"
                      value={makeForm.seed}
                      onChange={(e) => setMakeForm({ ...makeForm, seed: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">Deposit Amount</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      placeholder="Amount to deposit (in lamports)"
                      value={makeForm.depositAmount}
                      onChange={(e) => setMakeForm({ ...makeForm, depositAmount: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount in base units (1000000 = 0.001 tokens with 9 decimals)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiveAmount">Receive Amount</Label>
                    <Input
                      id="receiveAmount"
                      type="number"
                      placeholder="Amount to receive (in lamports)"
                      value={makeForm.receiveAmount}
                      onChange={(e) => setMakeForm({ ...makeForm, receiveAmount: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount in base units (2000000 = 0.002 tokens with 9 decimals)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleValidateEscrow}
                    disabled={!validateMutation || validateMutation.isPending || !makeForm.mintA || !makeForm.mintB}
                    className="flex-1"
                  >
                    {validateMutation?.isPending ? 'Validating...' : 'Validate Setup'}
                  </Button>
                  <Button
                    onClick={handleMakeEscrow}
                    className="flex-1"
                    disabled={
                      !makeMutation ||
                      makeMutation.isPending ||
                      !makeForm.mintA ||
                      !makeForm.mintB ||
                      !makeForm.seed ||
                      !makeForm.depositAmount ||
                      !makeForm.receiveAmount
                    }
                  >
                    {makeMutation?.isPending ? 'Creating Escrow...' : 'Create Escrow'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="take" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Take Escrow</CardTitle>
                <CardDescription>
                  Complete an existing escrow transaction. You will send Token B and receive Token A.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="escrowAccount">Escrow Account Address</Label>
                    <Input
                      id="escrowAccount"
                      placeholder="Escrow account address"
                      value={takeForm.escrowAccount}
                      onChange={(e) => setTakeForm({ ...takeForm, escrowAccount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maker">Maker Address</Label>
                    <Input
                      id="maker"
                      placeholder="Original escrow maker address"
                      value={takeForm.maker}
                      onChange={(e) => setTakeForm({ ...takeForm, maker: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mintA">Token A Mint Address</Label>
                    <Input
                      id="mintA"
                      placeholder="Token A mint address"
                      value={takeForm.mintA}
                      onChange={(e) => setTakeForm({ ...takeForm, mintA: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mintB">Token B Mint Address</Label>
                    <Input
                      id="mintB"
                      placeholder="Token B mint address"
                      value={takeForm.mintB}
                      onChange={(e) => setTakeForm({ ...takeForm, mintB: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleTakeEscrow}
                  disabled={
                    !takeMutation ||
                    takeMutation.isPending ||
                    !takeForm.escrowAccount ||
                    !takeForm.maker ||
                    !takeForm.mintA ||
                    !takeForm.mintB
                  }
                  className="w-full"
                >
                  {takeMutation?.isPending ? 'Taking Escrow...' : 'Take Escrow'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refund" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Refund Escrow</CardTitle>
                <CardDescription>
                  Cancel and refund your own escrow transaction. Only the original maker can refund.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="escrowAccount">Escrow Account Address</Label>
                    <Input
                      id="escrowAccount"
                      placeholder="Escrow account address"
                      value={refundForm.escrowAccount}
                      onChange={(e) => setRefundForm({ ...refundForm, escrowAccount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mintA">Token A Mint Address</Label>
                    <Input
                      id="mintA"
                      placeholder="Token A mint address"
                      value={refundForm.mintA}
                      onChange={(e) => setRefundForm({ ...refundForm, mintA: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleRefundEscrow}
                  disabled={
                    !refundMutation || refundMutation.isPending || !refundForm.escrowAccount || !refundForm.mintA
                  }
                  className="w-full"
                >
                  {refundMutation?.isPending ? 'Refunding Escrow...' : 'Refund Escrow'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function EscrowFeature() {
  return (
    <AppErrorBoundary>
      <EscrowFeatureContent />
    </AppErrorBoundary>
  )
}
