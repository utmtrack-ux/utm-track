import axios from 'axios'

const BASE = 'https://graph.facebook.com/v21.0'

export class MetaApiClient {
  constructor(private accessToken: string) {}
  
  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const response = await axios.get(`${BASE}${path}`, {
      params: { ...params, access_token: this.accessToken }
    })
    return response.data
  }
  
  async getMe() { 
    return this.get<{id:string,name:string,email?:string}>('/me', {fields:'id,name,email'}) 
  }
  
  async getAdAccounts() {
    const data = await this.get<{data: any[]}>('/me/adaccounts', {
      fields: 'id,name,currency,timezone_name,account_status,amount_spent'
    })
    return data.data
  }
  
  async getCampaigns(adAccountId: string) {
    const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
    const data = await this.get<{data: any[]}>(`/${accountId}/campaigns`, {
      fields: 'id,name,status,objective,buying_type,daily_budget,lifetime_budget,start_time,stop_time',
      limit: '500'
    })
    return data.data
  }
  
  async getAdSets(campaignId: string) {
    const data = await this.get<{data: any[]}>(`/${campaignId}/adsets`, {
      fields: 'id,name,status,daily_budget,lifetime_budget,optimization_goal,billing_event,bid_amount,start_time,end_time',
      limit: '500'
    })
    return data.data
  }
  
  async getAds(adSetId: string) {
    const data = await this.get<{data: any[]}>(`/${adSetId}/ads`, {
      fields: 'id,name,status,creative',
      limit: '500'
    })
    return data.data
  }
  
  async getInsights(adAccountId: string, level: 'campaign'|'adset'|'ad', datePreset: string, since?: string, until?: string) {
    const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
    const params: Record<string,string> = {
      fields: 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,clicks,unique_clicks,ctr,cpc,cpm,frequency,actions,action_values,conversions,conversion_values',
      level,
      limit: '500'
    }
    if (since && until) { 
      params.time_range = JSON.stringify({since, until}) 
    } else { 
      params.date_preset = datePreset 
    }
    
    const data = await this.get<{data: any[]}>(`/${accountId}/insights`, params)
    return data.data
  }
}
