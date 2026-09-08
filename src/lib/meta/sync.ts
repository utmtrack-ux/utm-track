import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/encryption'
import { MetaApiClient } from './client'

export async function syncAdAccount(workspaceId: string, adAccountDbId: string) {
  try {
    const account = await prisma.adAccount.findUnique({
      where: { id: adAccountDbId }
    })

    if (!account) throw new Error('Ad account not found')
    if (!account.accessTokenEnc) throw new Error('No access token for ad account')

    const token = decrypt(account.accessTokenEnc)
    const client = new MetaApiClient(token)

    const syncLog = await prisma.syncLog.create({
      data: {
        workspaceId,
        adAccountId: account.id,
        status: 'running',
        type: 'meta_ads'
      }
    })

    const campaigns = await client.getCampaigns(account.externalId)
    let totalAdSets = 0
    let totalAds = 0

    for (const c of campaigns) {
      const dbCampaign = await prisma.campaign.upsert({
        where: {
          adAccountId_externalId: {
            adAccountId: account.id,
            externalId: c.id
          }
        },
        update: {
          name: c.name,
          status: c.status,
          objective: c.objective || null,
          lastSyncAt: new Date()
        },
        create: {
          workspaceId,
          adAccountId: account.id,
          externalId: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective || null,
          lastSyncAt: new Date()
        }
      })

      const adSets = await client.getAdSets(c.id)
      totalAdSets += adSets.length
      
      for (const as of adSets) {
        const dbAdSet = await prisma.adSet.upsert({
          where: {
            campaignId_externalId: {
              campaignId: dbCampaign.id,
              externalId: as.id
            }
          },
          update: {
            name: as.name,
            status: as.status,
            lastSyncAt: new Date()
          },
          create: {
            workspaceId,
            campaignId: dbCampaign.id,
            externalId: as.id,
            name: as.name,
            status: as.status,
            lastSyncAt: new Date()
          }
        })

        const ads = await client.getAds(as.id)
        totalAds += ads.length

        for (const ad of ads) {
          await prisma.ad.upsert({
            where: {
              adSetId_externalId: {
                adSetId: dbAdSet.id,
                externalId: ad.id
              }
            },
            update: {
              name: ad.name,
              status: ad.status,
              lastSyncAt: new Date()
            },
            create: {
              workspaceId,
              adSetId: dbAdSet.id,
              externalId: ad.id,
              name: ad.name,
              status: ad.status,
              lastSyncAt: new Date()
            }
          })
        }
      }
    }

    // Update adAccount lastSyncAt
    await prisma.adAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() }
    })

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        itemsTotal: campaigns.length + totalAdSets + totalAds,
        itemsProcessed: campaigns.length + totalAdSets + totalAds
      }
    })

    return { success: true, campaigns: campaigns.length, adSets: totalAdSets, ads: totalAds, errors: [] }
  } catch (error: any) {
    return { success: false, campaigns: 0, adSets: 0, ads: 0, errors: [error?.message || 'Erro desconhecido'] }
  }
}

export async function syncInsightsOnly(workspaceId: string, adAccountDbId: string, since: string, until: string) {
  try {
    const account = await prisma.adAccount.findUnique({
      where: { id: adAccountDbId }
    })
    if (!account || !account.accessTokenEnc) return { success: false, error: 'Account or token not found' }
    
    const token = decrypt(account.accessTokenEnc)
    const client = new MetaApiClient(token)
    const insights = await client.getInsights(account.externalId, 'campaign', 'last_30d', since, until)

    return { success: true, count: insights.length }
  } catch (e: any) {
    return { success: false, error: e?.message }
  }
}
