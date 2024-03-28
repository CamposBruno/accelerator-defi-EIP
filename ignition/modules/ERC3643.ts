import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const implementations = buildModule("ERC3643_implementations", (m) => {
  const deployer = m.getAccount(0);

  //Deploy implementations
  const claimTopicsRegistryImplementation = m.contract('ClaimTopicsRegistry', [], { from: deployer });
  const trustedIssuersRegistryImplementation = m.contract('TrustedIssuersRegistry', [], { from: deployer });
  const identityRegistryStorageImplementation = m.contract('IdentityRegistryStorage', [], { from: deployer });
  const identityRegistryImplementation = m.contract('IdentityRegistry', [], { from: deployer });
  const modularComplianceImplementation = m.contract('ModularCompliance', [], { from: deployer });
  const tokenImplementation = m.contract('Token', [], { from: deployer });
  const identityImplementation = m.contract('Identity', [deployer, true], { from: deployer });
  const identityImplementationAddress = m.readEventArgument(identityImplementation, "Deployed", "addr");
  const identityImplementationAuthority = m.contract('ImplementationAuthority', [identityImplementationAddress], { from: deployer, after: [identityImplementation] });
  const trexImplementationAuthority = m.contract('TREXImplementationAuthority', [true, ethers.ZeroAddress, ethers.ZeroAddress], { from: deployer });

  return { 
    claimTopicsRegistryImplementation,
    trustedIssuersRegistryImplementation,
    identityRegistryStorageImplementation,
    identityRegistryImplementation,
    modularComplianceImplementation,
    tokenImplementation,
    identityImplementation,
    identityImplementationAuthority,
    trexImplementationAuthority,
  };
});

const factories = buildModule("ERC3643_factories", (m) => {
  const deployer = m.getAccount(0);

  const { 
    identityImplementationAuthority,
    tokenImplementation,
    claimTopicsRegistryImplementation,
    identityRegistryImplementation,
    identityRegistryStorageImplementation,
    trustedIssuersRegistryImplementation,
    modularComplianceImplementation,
    trexImplementationAuthority,
  } = m.useModule(implementations);
  
  const versionStruct = {
    major: 4,
    minor: 0,
    patch: 0,
  };

  const contractsStruct = {
    tokenImplementation: tokenImplementation,
    ctrImplementation: claimTopicsRegistryImplementation,
    irImplementation: identityRegistryImplementation,
    irsImplementation: identityRegistryStorageImplementation,
    tirImplementation: trustedIssuersRegistryImplementation,
    mcImplementation: modularComplianceImplementation,
  };

  m.call(trexImplementationAuthority, "addAndUseTREXVersion", [versionStruct, contractsStruct], { after : [
    tokenImplementation,
    claimTopicsRegistryImplementation,
    identityRegistryImplementation,
    identityRegistryStorageImplementation,
    trustedIssuersRegistryImplementation,
    modularComplianceImplementation,
  ]});
  
  const identityFactory = m.contract('IdFactory', [identityImplementationAuthority], { from: deployer });
  const TREXFactory = m.contract("TREXFactory", [trexImplementationAuthority, identityFactory]);

  m.call(identityFactory, "addTokenFactory", [TREXFactory]);

  return { 
    identityFactory,
    TREXFactory,
  };
});

const compliance = buildModule("ERC3643_compliance", (m) => {
  const deployer = m.getAccount(0);

  const requiresNFTModule = m.contract('RequiresNFTModule', [], { from: deployer });
  const countryAllowModule = m.contract('CountryAllowModule', [], { from: deployer });

  return { 
    requiresNFTModule,
    countryAllowModule,
  };
});

export default buildModule("ERC3643", (m) => {
  const implementationsModule = m.useModule(implementations);
  const factoriesModule = m.useModule(factories);
  const complianceModule = m.useModule(compliance);

  return {
    ...implementationsModule,
    ...factoriesModule,
    ...complianceModule,
  };
});
