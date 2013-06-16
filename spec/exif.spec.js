var exif = require('../lib/exif');

beforeEach(function () {
	this.addMatchers({
		toBeInstanceOf: function (expected) {return this.actual instanceof expected;},
		hasProperty: function (expected) {return expected in this.actual;}
	});
});


describe("exif data extraction", function () {
	it("should find no EXIF data in violet_3000x2000.jpg", function () {
		var result, errorResult;

		new exif.ExifImage({ image: "testdata/violet_3000x2000.jpg" }, function (error, exifData) {
			if (! error) {
				console.log("unexpected Exif success: " + JSON.stringify(exifData));
//			} else {
//				console.log("expected Exif error: " + error.message);
			}
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting violet_3000x2000.jpg", 15000);

		runs(function () {
			expect(errorResult).toBeDefined();
			expect(errorResult.message).toBeDefined();
			expect(result).not.toBeDefined();
		});
	});

	it("should find EXIF data in Cistothorus_palustris_CT.jpg", function () {
		var result, errorResult;

		new exif.ExifImage({ image: "testdata/Cistothorus_palustris_CT.jpg" }, function (error, exifData) {
			if (error) {
				console.log("Exif error: " + error.message);
			}
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting Cistothorus_palustris_CT.jpg", 15000);

		runs(function () {
			expect(errorResult).toBeFalsy();
			expect(result).toBeDefined();
			expect(result).hasProperty("image");
			expect(result.image).hasProperty("Make");
			expect(result.image.Make).toEqual("Canon");
			expect(result.image).hasProperty("Model");
			expect(result.image.Model).toEqual("Canon EOS 40D");
			expect(result.image).hasProperty("Orientation");
			expect(result.image.Orientation).toBe(1);
			expect(result.image).hasProperty("XResolution");
			expect(result.image.XResolution).toBe(72);
			expect(result.image).hasProperty("YResolution");
			expect(result.image.YResolution).toBe(72);
			expect(result.image).hasProperty("Software");
			expect(result.image.Software).toEqual("GIMP 2.6.11");
			expect(result.image).hasProperty("ModifyDate");
			expect(result.image.ModifyDate).toBe("2011:06:19 16:06:37");
			expect(result).hasProperty("thumbnail");
			expect(result.thumbnail).hasProperty("Compression");
			expect(result.thumbnail.Compression).toBe(6);
			expect(result.thumbnail).hasProperty("XResolution");
			expect(result.thumbnail.XResolution).toBe(72);
			expect(result.thumbnail).hasProperty("YResolution");
			expect(result.thumbnail.YResolution).toBe(72);
			expect(result.thumbnail).hasProperty("ResolutionUnit");
			expect(result.thumbnail.ResolutionUnit).toBe(2);
			expect(result).hasProperty("exif");
			expect(result.exif).hasProperty("ExposureTime");
			expect(result.exif.ExposureTime).toBe(0.002);
			expect(result.exif).hasProperty("FNumber");
			expect(result.exif.FNumber).toBe(8);
			expect(result.exif).hasProperty("ExposureProgram");
			expect(result.exif.ExposureProgram).toBe(2);
			expect(result.exif).hasProperty("ISO");
			expect(result.exif.ISO).toBe(160);
			expect(result.exif).hasProperty("DateTimeOriginal");
			expect(result.exif.DateTimeOriginal).toEqual("2011:06:19 10:38:09");
			expect(result.exif).hasProperty("CreateDate");
			expect(result.exif.CreateDate).toEqual("2011:06:19 10:38:09");
			expect(result.exif).hasProperty("FocalLength");
			expect(result.exif.FocalLength).toBe(400);
			expect(result.exif).hasProperty("UserComment");
//			expect(result.exif[13].value).toBe("");
			expect(result.exif).hasProperty("ExifImageWidth");
			expect(result.exif.ExifImageWidth).toBe(1736);
			expect(result.exif).hasProperty("ExifImageHeight");
			expect(result.exif.ExifImageHeight).toBe(1736);
			expect(Object.keys(result.gps).length).toEqual(1);
			expect(result.gps).hasProperty("GPSVersionID");
			expect(result).hasProperty("interoperability");
			expect(result.interoperability).toEqual({});
			expect(result).hasProperty("makernote");
			expect(result.makernote).toEqual({});
		});
	});

	it("should find EXIF data in direct buffer", function () {
		var result, errorResult;

		var hex_string = "45786966000049492a00080000000b000f0102000600000092000000100102000e000000980000001201030001000000010000001a01050001000000a60000001b01050001000000ae000000280103000100000002000000310102000c000000b60000003201020014000000c20000001302030001000000010000006987040001000000d600000025880400010000009c030000ae03000043616e6f6e0043616e6f6e20454f5320343044004800000001000000480000000100000047494d5020322e362e313100323031313a30363a31392031363a30363a3337001c009a820500010000002c0200009d82050001000000340200002288030001000000020000002788030001000000a000000000900700040000003032323103900200140000003c02000004900200140000005002000001910700040000000102030001920a00010000006402000002920500010000006c02000004920a0001000000740200000992030001000000100000000a920500010000007c02000086920700080100008402000090920200030000003037000091920200030000003037000092920200030000003037000000a00700040000003031303001a00300010000000100000002a0030001000000c806000003a0030001000000c80600000ea20500010000008c0300000fa20500010000009403000010a20300010000000200000001a40300010000000000000002a40300010000000000000003a40300010000000000000006a4030001000000000000000000000001000000f40100000800000001000000323031313a30363a31392031303a33383a303900323031313a30363a31392031303a33383a303900000009000000010000000600000001000000000001000000900100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080533b006c030000008d27004702000001000000010004000000020200000000000006000301030001000000060000001a01050001000000fc0300001b010500010000000404000028010300010000000200000001020400010000000c04000002020400010000006d1100000000000080fc0a001027000080fc0a0010270000ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffc000110800c400c403012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000102030405060708090a0bffc400b51100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00c9c53938a68a70af0e27293c4c37807919e692cd5a285a16fbd1bb21e7d0d468d87156091f6d9c631bd524fae460fea2b68eb068d22fdd688a4eb49788c5a098fdd6806320763b7fa5129f9a92f9d52dac002ec5d1c371c29dcc40fc853a6b7f42a9fda5e4440f152a9aae1a9ead4ac624e1b14d76cd34b544cfcd480f06945421aa5539a4c09d053c0e6923a954566ca44c82abeb3206f19dfabb925e25753e9d38fd6ad20e9f4aa1ae0dbe2b81807fde59a1cb74fbaa4e3f1cd6f4b667653f825e823702a35eb5249d2a3152710ecd2834ccf34b9a9287eea693499a4a005ef52a9f96a11d734f0700d12d84349e68a616e68a04354d385340a5a4842f7ab24379d6f263e568d933ee0823f99aaf8ef52c86316914ccce0c52a81b464739073cfa55c1eb635a4af2b7a8928e69b741dac6cd82811abcaa481df008cfe67f2a965151481cd8c640628b7041f4c95ffeb56b4b72a9eefd194c53837349da9b9c1a5d0c5a26ddc544cdcd26ea8d9b9a9622456e6a746e6a9ab735346dcd4b03463ab0954e36ab71f4ac9948b0bd05676bd185f106992900b3da63e552380319cf43dc569a0ca8359fe20005de8721e4f96ebc13fdf3d7b74fe55bd1ea7652d9af21aff76a1a95cf151e2b3b9c7d468eb4ea4c529a43b05277a781c518e681d86d2ff09a08e683d28158809e68a6b7dea2a882514b48bd29d8a900ea29fb7ccd32f90b30c45bc6d5cfdd20fe1df9ed4c153da1025642c54491b26e1db20d5d3769a65d3769a62bb0922575180ca0fe62920532585d00cdf23c6d8c64753c9ff3deaa58ca64d3212589c0da09ee0703f0c62ac5bb6db3be3b41608ad9f41bc03fceb78e933582b54b147d6a33d6a43f7cf7e698c39acee62c6e698c69f8e698e39a4c913bd365bd86cd03ccfb413c52e2b92f155c16b88e2c636f623af4e6ae9439e5665d38f33d4ee34ebfb7be8b7c120603823d2b5a3e95c1f819cb35c27c9c007d0fe55ddc7d2b2ad0509348b71b3d0bb17dcaabaf4464b4d1e505b6c770c8c00e3248233ebd7fcf7b109f96a1d6a453a1d91da77c77ad8c118e541c9fa633c55513a68945b9a00e29d8cb1fad2e2b3ea72a8ea376d26da931462917ca300a76da76296829448cad31978a9e98e38a64ca25361f3514f61cd14cc6c3d69d8e29b4f1d29084039a9207115d4521190ac0918ce7069a050e31cd3480a8b9b7bdbfb3c10219c8527b8ff22ae69b891ee236fb8f0306fa707fa0a8b558997535b960a7ed36c8c197d4000e7f5fd292c1cadc360e331b8fafca71fae2b7a9f15d1d3ff2f93ef62123e73eb9a6b8a729cf3eb438ac9bd4c64b564205230a78a319a5733210bcd70fe2307edec0938defc06c8fbe47e1d2bbfd9c66b89f1647b2fe25ceef909c9ebcb138fd6ba30cfde37a2b4669f80119a5b92795da0723fcfa577aab85ae1fc0073f6923d147f3aee58e2b2c47f119a496a4b11e0d56d619974091c4659639d4b1dc00008ef9f703a7a54b19eb4b751bdc685a8c2bb78313e5f90b86c13fad14b466b495999c8e586e3c679a93350a1f9464f500f07daa55e6b396e656d47d14e038a4ef486d094eed4da5cd0342134d6e4538d30d32590b75a29c7ad1418d8053c52014a2846639695c70691695b95aa43441a8ab4b67a65c2ff03bdbb6075e4b01c75fbddff5a65863edb103d19b6fe278a919c0d26ebe60248a54963ce7df3823a1e00f4eb9a8ecce2f60651bbf78a40cf5e6b59eb18b3a12f858c8c700539978a5552acc08c10c411f8d3c8e2b19eec8a8bde641b29fb38a7014f22833b101e14d5eb3f0459eb7241aaeaf75159d804023323006518ea14fbe7fc2996b6e2694ee29b5464ab1233edc57a02787ed6f2d52eae3648aa06432e548c73b4fa0fe9ef5d14525af53aa842d172679c36a9e1eb5be1a56937578879c4903a229c123952063f3fe62b6a6802c71c6ba9a5dbaa8dfbd39273cf2056c7fc229a5daea925ed8d9c2b79720a863caa0eed81c76aab2b7f61c0d691806e189dee7a8cff5ade69b37524b7316e9d84a52cd4e7fbcfc01f89ce7f2a9619668ac351f35f737d91b3e50dbdc73f87b5441cb4accc7249eb520884e6489b761a27ced5dc7804f41d7a57329de56e8445a6f4465db32b5bc6cb8c145c71ed53a9c1aa760dbec626ce49073cf4e4d5aaca5f13264b565a4208a08e6a3538e94e2d93523e806a3ddcd2939a61a0863f34d2699ba973c50436349e68a43450664a052d14a29a3210538f4a6f7a53d2a8688a14de2ee2c2e1e06e5bb6df9b3ff008ed4164cfb2da50df3e14e4f623ffae2add9955d461de014670ac0f420f07f4355914c52cf01c0682778f83d307d3b75e957f60e88eb4fd09aea2f2350bb8f76e0b33007d69a0f1525f15fed4bbc3672f927d7dea053c54d45ab0a9f131c3ad4aaa58800649e0015003cd6ef87b493a95d19598ac16e433103a9cf02a62aeec4423cd248e9b42f081104534ec77bfcdf20c8c7f9fe55d3c3a65d221df2c6b6e1b2b918282a1b4d40084825481c638cb532fb580b1025d31bb1b3aee3db35d94d27b1db2f7158c9d66fe4864d96fb368ce4f5cd729366eee199dbf78e4f24f7f5ab7a85ebdc48e781e98e456634c231bd88cd743473b776538befe0f51c1ab50bbc73831fdf64741cf76523fad675b5ca497cf1824b1cb63d2a6d401fb1ca5490db4e08af379796563482e57633ac0eeb7f6dc7b55be82a96940fd906e6dc77124fad5d3513f89933d26c507029f9a603c519a4314d21a33484d02635a9b9a18f38a6d339e5b8b9a29b45226e5cc5029474a4aab1037bd29e9477a0d558115dc957041208e86a5d402aebd78508db3245720018e5d727af604e2a392a4bddacb617191b9e0685c03dd0920e3b7181f85690d9a3a29ea9a2bc8c8d75332720e3f950b50061e73e3a54c8722a2a6e151ea38f5ae97c26c7cdbc56388da3524f3c104ff8d7326b7b4998d8da7da1767cc1b3bbd454c372a87c7736750d652d9845850c07cacdd00fa573936b59508ac5981e09e94dd46e9af5c3395e47615892050df29ef5df18f26c5ce7cc6abdf313bfb28ef59f777a2524ee1d3b1ef55e694ed600f6c540a831ea4f7a4e6c948b7a5f37c5f0338eb8adaba5dd6ce00c9da7f9563d97cb3960b81c735b4c774440f4ae39eb22efa9916842421454c58d57b71b508e8702a4359496a4d67efb2556a5cf151ad3a90afa01346ea4a422821c833b8e698fc1a905325eb4d19541377145301a2832b9a228a6e6941ad6c50351da91a9334ec0452f4a599c7f62090706dee41639fe17001e31fecd24df769202b2595fdbb207f321c8c8ce0839cfe1eb550dcde8bf7914c9fde631ce2a68ce2a00fbf61520a11c11dfbd4e838a9a8b51cd6a87e73534f24b1694ad1e7fd690de9d063fad423ad747a958c763a6699a63e5af6f49948e81011c67f014a9a77b95496a7251dfbf9222645c0ee05472ce31fd2b5cd84116d3856246783d39ef418227fbd1a9fa8ad6555ad07271b983e72ed39ea6a337193f2f03b9ae85ad2dd936794a01f41589a9dafd9d8aa8c03d288be6438b4f61fa74c6425b27686c57468731d735a726cb5dc3fbf5d1407318a87f105fdf665c40a9743d41c67f134fa6fddbb99739c13f85381153516a4d5dc7a8e28ef46ec0a6eee6b1b1171f8a4a33c521342062d452d499a8dce699954183a51403c514cc8bd9a506980d2835b1439a933c52134500324e529fa395fed5891c2912ee8be6e9f3a9519f6e698dd0d558e430ce922fde460c3f0345ec5c5d9dc8e08f16a304b22394cfe7fd31566352e42a8258f000ef5a1359c937dac88041035c2491b303cef07800753c0e056425d9fb7cb05a480a4590f32f73e83d2aea45dee764e9dda7d0d4012c8ff0c9760f4eab1ff8b7e8294cb2cf2092591de451b43b1c9c7a67d2a9a0c1156a31cd637ec6529e968e889314bb714538f4a46644c4a9c8aaf7682e2dd9180dc07ca7d2ac4950939a149ad869d8cab63e5279527cb23124a9f6adeb61fbb5ace9e359130dce3a1f4abd6926d511ca406c641ecc2b54f9f5ea6919293b99d71f2ea5200782338a051a8111eaca49c2b2e0fe5ffd7a715c0cd4cc75ba3f210b519a6134eac8e7b8f068cd3334e1d281dc52714c3d295b93476a66721a28a28a4416a8a4a5adca168a4a3340c6b1e0d537e5c0c8193d4f6ab4e7ad5390fcd52c62dccf3ea1a95b693a66ef359951ae4bbfcc186d3804fcab807240c919fa52d95a8b4b7108032a4e48ee734f86090c33dcc2de5c912025c1c1c640c7ea69ea7029cdde28ebab539a08950722ad47d6aac679ab51d668c090d3a9b4fa684432d404e2accb559a868444dd6ae4f6af73a795888128c1424e391550f515af6bfea569c74772a93f78e0a7bbbc375209263985b0c9260301f5eff85743a7ce97da7aca88eb8f97e7ea48ef51eb9650fda04bf67dfbd86ec62afdb451dbc1e5c6a557fba4938fceaeb4ae8e8acd59144ae1c8a931c53a44c484d281c56071909eb4f1d282bcd140ee18e69074a767e5a00e2990c674a283d68a4496051451dab72c294f229b9a5078a0085cd5671cd5b6155dd6a58cb7627363a8c7b725a0ddf4c30aaebd01a9f4dcf9938ce01b7933c75c293fd2a18fe650687f09b6f4d7a92c7d6adc75593835663a944121a7f6a677a7d340472f4aa8c79ab529e2aa375a04c4eb5ad6a7f702b296b4acff00d48a6553f88a1aa8e11c9e030a7f98cc77331663c926935742d68d8ea197f9d47d1549392541356d5e0fe46f88fe1a1ce334cef4e0d9a43d6b991c4318530d4a4542c79a68628e69f8e298bd454d8e2981011cd14f239a28024c628278a29a6b618519c0a4ef4e22818d3cd4520a97bd46e28604fa5a86be553fc48e39f52a7155e0e55b8e43115734a0a353b7dfc29700fe3c5558576cb2a678c8207e9fd2925ee9d1057a6d1328f6a9e3a8d471524639a93224a79a677a713c53111c9d2aa31e6ad39e2a939e6810a0f35a7667f778f7ac8ce1ab56cb95a10e0fde2792159acef8b6372425d78e7391594a31127393b6b651414ba1bb04dbb05faf1592233f638a40a70720ff002fe60d68be168e9adad2b9183834a6908ef480e6b9dad4e11c7a540fd6a7ed503f5a10c7275a9fb5431f6a9d46698d0813228ab491fcbd28a2c3b15474a8da8a2b6001d6a4a28a0061fbd48c0668a2802ce9dff210b7ff00aeabfcc547322c77a36ff11901fc0d14538ecceaa7f0324029c9d68a2b33063fbd29e9451412c89fa55193ef514502646c79ad5b03fbb14514d0a1f11a7680349393da1723f2a6daa2cbe108d987292363f3a28ad63d4ed97f0998927071512f5a28ac2470b1edd2a000e16060b2b82400000141f0f2c8240000e11b6fb2b82400";

		var test_buffer = new Buffer(hex_string, "hex");

		new exif.ExifImage({ exif_buffer: test_buffer }, function (error, exifData) {
			if (error) {
				console.log("Exif error: " + error.message);
			}
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting direct EXIF from buffer", 15000);

		runs(function () {
			expect(errorResult).toBeFalsy();
			expect(result).toBeDefined();
			expect(result).hasProperty("image");
			expect(result.image).hasProperty("Make");
			expect(result.image.Make).toEqual("Canon");
			expect(result.image).hasProperty("Model");
			expect(result.image.Model).toEqual("Canon EOS 40D");
			expect(result.image).hasProperty("Orientation");
			expect(result.image.Orientation).toBe(1);
			expect(result.image).hasProperty("XResolution");
			expect(result.image.XResolution).toBe(72);
			expect(result.image).hasProperty("YResolution");
			expect(result.image.YResolution).toBe(72);
			expect(result.image).hasProperty("Software");
			expect(result.image.Software).toEqual("GIMP 2.6.11");
			expect(result.image).hasProperty("ModifyDate");
			expect(result.image.ModifyDate).toBe("2011:06:19 16:06:37");
			expect(result).hasProperty("thumbnail");
			expect(result.thumbnail).hasProperty("Compression");
			expect(result.thumbnail.Compression).toBe(6);
			expect(result.thumbnail).hasProperty("XResolution");
			expect(result.thumbnail.XResolution).toBe(72);
			expect(result.thumbnail).hasProperty("YResolution");
			expect(result.thumbnail.YResolution).toBe(72);
			expect(result.thumbnail).hasProperty("ResolutionUnit");
			expect(result.thumbnail.ResolutionUnit).toBe(2);
			expect(result).hasProperty("exif");
			expect(result.exif).hasProperty("ExposureTime");
			expect(result.exif.ExposureTime).toBe(0.002);
			expect(result.exif).hasProperty("FNumber");
			expect(result.exif.FNumber).toBe(8);
			expect(result.exif).hasProperty("ExposureProgram");
			expect(result.exif.ExposureProgram).toBe(2);
			expect(result.exif).hasProperty("ISO");
			expect(result.exif.ISO).toBe(160);
			expect(result.exif).hasProperty("DateTimeOriginal");
			expect(result.exif.DateTimeOriginal).toEqual("2011:06:19 10:38:09");
			expect(result.exif).hasProperty("CreateDate");
			expect(result.exif.CreateDate).toEqual("2011:06:19 10:38:09");
			expect(result.exif).hasProperty("FocalLength");
			expect(result.exif.FocalLength).toBe(400);
			expect(result.exif).hasProperty("UserComment");
//			expect(result.exif[13].value).toBe("");
			expect(result.exif).hasProperty("ExifImageWidth");
			expect(result.exif.ExifImageWidth).toBe(1736);
			expect(result.exif).hasProperty("ExifImageHeight");
			expect(result.exif.ExifImageHeight).toBe(1736);
			expect(Object.keys(result.gps).length).toEqual(1);
			expect(result.gps).hasProperty("GPSVersionID");
			expect(result).hasProperty("interoperability");
			expect(result.interoperability).toEqual({});
			expect(result).hasProperty("makernote");
			expect(result.makernote).toEqual({});
		});
	});

	it("should find EXIF data in crasher.jpg", function () {
		var result, errorResult;

		new exif.ExifImage({ image: "testdata/crasher.jpg" }, function (error, exifData) {
			if (error) {
				console.log("Exif error: " + error.message);
			}
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting crasher.jpg", 15000);

		runs(function () {
			expect(errorResult).toBeFalsy();
			expect(result).toBeDefined();
			expect(result).hasProperty("image");
			expect(result.image).hasProperty("Make");
			expect(result.image.Make).toEqual("Canon");
			expect(result).hasProperty("exif");
			expect(result.exif).hasProperty("ExifImageWidth");
			expect(result.exif.ExifImageWidth).toBe(400);
			expect(result.exif).hasProperty("ExifImageHeight");
			expect(result.exif.ExifImageHeight).toBe(600);
		});
	});

	it("should find EXIF data in no-gpsinfo.jpg", function () {
		var result, errorResult;

		new exif.ExifImage({ image: "testdata/no-gpsinfo.jpg" }, function (error, exifData) {
			if (error) {
				console.log("Exif error: " + error.message);
			}
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting no-gpsinfo.jpg", 15000);

		runs(function () {
			expect(errorResult).toBeFalsy();
			expect(result).toBeDefined();
			expect(result).hasProperty("image");
			expect(result.image).hasProperty("Make");
			expect(result.image.Make).toEqual("NIKON CORPORATION");
			expect(result).hasProperty("exif");
			expect(result.exif).hasProperty("FocalLength");
			expect(result.exif.FocalLength).toBe(24);
		});
	});

	it("should not find EXIF data in no-exif.jpg", function () {
		var result, errorResult;

		new exif.ExifImage({ image: "testdata/no-exif.jpg" }, function (error, exifData) {
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting no-exif.jpg", 15000);

		runs(function () {
			expect(errorResult).toBeDefined();
			expect(result).toBeFalsy();
		});
	});

	it("should find EXIF data and not crash with byte typed makernote in bad-makernote.jpg", function () {
		var result, errorResult;

		new exif.ExifImage({ image: "testdata/bad-makernote.jpg" }, function (error, exifData) {
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting bad-makernote.jpg", 15000);

		runs(function () {
			expect(errorResult).toBeFalsy();
			expect(result).toBeDefined();
			expect(result.makernote).hasProperty("error");
			expect(result).hasProperty("exif");
			expect(result.exif).hasProperty("ExifImageWidth");
			expect(result.exif.ExifImageWidth).toBe(1936);
			expect(result.exif).hasProperty("ExifImageHeight");
			expect(result.exif.ExifImageHeight).toBe(2592);
		});
	});

	it("should find EXIF data and not crash in endian-flipped-makernote.jpg", function () {
		var result, errorResult;

		new exif.ExifImage({ image: "testdata/endian-flipped-makernote.jpg" }, function (error, exifData) {
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting endian-flipped-makernote.jpg", 15000);

		runs(function () {
			expect(errorResult).toBeFalsy();
			expect(result).toBeDefined();
			// expect(result.makernote).hasProperty("error");
			expect(result).hasProperty("exif");
			expect(result.exif).hasProperty("ExifImageWidth");
			expect(result.exif.ExifImageWidth).toBe(965);
			expect(result.exif).hasProperty("ExifImageHeight");
			expect(result.exif.ExifImageHeight).toBe(1113);
		});
	});

	it("should find EXIF data and not crash in dodgy-exif.jpg", function () {
		var result, errorResult;

		new exif.ExifImage({ image: "testdata/dodgy-exif.jpg" }, function (error, exifData) {
			result = exifData;
			errorResult = error;
		});

		waitsFor(function () {return result || errorResult;}, "extracting dodgy-exif.jpg", 15000);

		runs(function () {
			expect(errorResult).toBeFalsy();
			expect(result).toBeDefined();
			// expect(result.makernote).hasProperty("error");
			expect(result).hasProperty("exif");
		});
	});


});
