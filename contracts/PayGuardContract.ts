import { Contract } from '@algorandfoundation/tealscript';

export default class PayGuardAI extends Contract {
  admin = GlobalStateKey<Address>();
  totalAgents = GlobalStateKey<uint64>();
  
  createApplication(admin: Address): void {
    this.admin.value = admin;
    this.totalAgents.value = 0;
  }

  createAgent(agentId: string, limit: uint64): void {
    assert(this.txn.sender === this.admin.value);
    this.totalAgents.value = this.totalAgents.value + 1;
    log(agentId);
    log(itob(limit));
  }

  approvePayment(requestId: uint64): void {
    assert(this.txn.sender === this.admin.value);
    log(itob(requestId));
  }
}